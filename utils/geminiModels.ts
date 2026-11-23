import { GoogleGenAI, Schema, ThinkingLevel } from "@google/genai";

// Zentrale, ausfallsichere Gemini-Steuerung mit:
// 1. High-Volume-Modellpool (bis zu 6 unabhängige Endpunkte inkl. 3.5/3.1/2.5 Flash-Lite & 3.8/3.6 Flash)
// 2. In-Memory Circuit Breaker (überspringt kurzzeitig überlastete/limitierte Modelle automatisch)
// 3. Schnelle Thinking-Konfiguration & Per-Attempt-Timeout (verhindert Vercel 504-Timeouts)
// 4. Automatischer Retry mit Jitter-Backoff bei transienten 503/429-Spitzen
// 5. Optionales Multi-Key-Fallback (GEMINI_API_KEY + optional GEMINI_API_KEYS / GEMINI_API_KEY_FALLBACK)

const modelCooldownUntil = new Map<string, number>();

function parseEnvModels(): string[] | null {
  const raw = (process.env.GEMINI_MODELS || "").trim();
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

/**
 * Liefert alle konfigurierten Gemini API Keys (primär GEMINI_API_KEY,
 * optional zusätzlich kommaseparierte GEMINI_API_KEYS oder GEMINI_API_KEY_FALLBACK).
 */
export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  const multi = (process.env.GEMINI_API_KEYS || "").trim();
  if (multi) {
    for (const k of multi.split(",").map((x) => x.trim()).filter(Boolean)) {
      if (!keys.includes(k)) keys.push(k);
    }
  }
  const primary = (process.env.GEMINI_API_KEY || "").trim();
  if (primary && !keys.includes(primary)) keys.unshift(primary);
  const fallback = (process.env.GEMINI_API_KEY_FALLBACK || "").trim();
  if (fallback && !keys.includes(fallback)) keys.push(fallback);
  return keys;
}

/**
 * Für komplette Arbeitsblatt-, Klassenarbeit- & Partnerarbeit-Generierung:
 * Startet mit schnellen, hochverfügbaren Modellen (hohes RPM/RPD-Kontingent) und
 * fällt nahtlos über bis zu 6 unabhängige Modell-Cluster zurück.
 */
export function getGenerateModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview",
    ]
  );
}

/**
 * Für schnelle Folgeaktionen (Einzelaufgabe anpassen, KI-Feinschliff,
 * Tipp-Karten & Stundenverlauf).
 */
export function getFastModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.6-flash",
    ]
  );
}

function classifyError(error: unknown): {
  kind: "rate_limit" | "overloaded" | "not_found" | "timeout" | "auth" | "bad_request" | "other";
  raw: string;
} {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error || "");
  if (
    raw.includes("401") ||
    raw.includes("403") ||
    /API_KEY_INVALID|PERMISSION_DENIED/i.test(raw)
  ) {
    return { kind: "auth", raw };
  }
  if (raw.includes("429") || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return { kind: "rate_limit", raw };
  }
  if (raw.includes("503") || raw.includes("502") || /UNAVAILABLE|overloaded|high demand/i.test(raw)) {
    return { kind: "overloaded", raw };
  }
  if (raw.includes("404") || /NOT_FOUND|no longer available/i.test(raw)) {
    return { kind: "not_found", raw };
  }
  if (/AbortError|TimeoutError|timed out|aborted/i.test(raw)) {
    return { kind: "timeout", raw };
  }
  if (raw.includes("400") || /INVALID_ARGUMENT/i.test(raw)) {
    return { kind: "bad_request", raw };
  }
  return { kind: "other", raw };
}

function markModelCooldown(modelName: string, kind: ReturnType<typeof classifyError>["kind"]) {
  const now = Date.now();
  if (kind === "not_found") {
    modelCooldownUntil.set(modelName, now + 15 * 60 * 1000);
  } else if (kind === "rate_limit") {
    modelCooldownUntil.set(modelName, now + 90 * 1000);
  } else if (kind === "overloaded") {
    modelCooldownUntil.set(modelName, now + 45 * 1000);
  } else if (kind === "timeout") {
    modelCooldownUntil.set(modelName, now + 30 * 1000);
  }
}

function sortByHealth(models: string[]): string[] {
  const now = Date.now();
  const healthy: string[] = [];
  const cooled: string[] = [];
  for (const m of models) {
    const until = modelCooldownUntil.get(m) || 0;
    if (until > now) cooled.push(m);
    else healthy.push(m);
  }
  // Gesunde Modelle zuerst; abgekühlte nur noch als Notfall-Reserve am Ende
  return [...healthy, ...cooled];
}

function getThinkingConfigForModel(modelName: string, mode: "generate" | "fast") {
  if (modelName.startsWith("gemini-2.5")) {
    return { thinkingBudget: 0 };
  }
  if (modelName.startsWith("gemini-3")) {
    return {
      thinkingLevel: mode === "fast" ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
    };
  }
  return undefined;
}

/**
 * Extrahiert und parst JSON robust – auch falls ein Modell Markdown-Fences nutzt.
 */
export function parseJsonFromModelText<T = Record<string, unknown>>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const unfenced = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      return JSON.parse(unfenced) as T;
    } catch {
      const firstBrace = unfenced.indexOf("{");
      const lastBrace = unfenced.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(unfenced.slice(firstBrace, lastBrace + 1)) as T;
      }
      throw new Error("KI-Antwort war kein gültiges JSON.");
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ResilientJsonOptions {
  apiKey?: string;
  mode: "generate" | "fast";
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
  systemInstruction?: string;
  responseSchema: Schema;
  temperature?: number;
  maxOutputTokens?: number;
  /** Timeout pro einzelnem Modellversuch (ms) */
  perAttemptTimeoutMs?: number;
  /** Maximales Gesamt-Zeitbudget vor Vercel-Funktionslimit (ms) */
  totalBudgetMs?: number;
}

/**
 * Führt eine strukturierte JSON-Generierung ausfallsicher über den Modellpool aus:
 * - Überspringt temporär überlastete/limitierte Modelle (Circuit Breaker)
 * - Nutzt schnelles Thinking-Level + Per-Attempt-Timeout gegen 504-Abbrüche
 * - Versucht bei transienter 503/429-Spitze nach kurzem Jitter-Backoff eine 2. Runde
 */
export async function generateJsonWithFallback<T = Record<string, unknown>>(
  opts: ResilientJsonOptions
): Promise<{ data: T; modelUsed: string }> {
  const keys = opts.apiKey ? [opts.apiKey] : getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY fehlt in den Vercel Environment Variables.");
  }

  const baseModels = opts.mode === "fast" ? getFastModels() : getGenerateModels();
  const orderedModels = sortByHealth(baseModels);
  const perAttemptMs = opts.perAttemptTimeoutMs ?? (opts.mode === "fast" ? 14_000 : 18_000);
  const totalBudgetMs = opts.totalBudgetMs ?? (opts.mode === "fast" ? 26_000 : 46_000);
  const startedAt = Date.now();

  let lastError: unknown = null;

  const tryModel = async (ai: GoogleGenAI, modelName: string, useThinking: boolean): Promise<T | null> => {
    const remaining = totalBudgetMs - (Date.now() - startedAt);
    if (remaining < 4_000) return null;

    const timeoutMs = Math.min(perAttemptMs, remaining - 500);
    const thinkingConfig = useThinking ? getThinkingConfigForModel(modelName, opts.mode) : undefined;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: opts.parts }],
      config: {
        ...(opts.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
        responseMimeType: "application/json",
        responseSchema: opts.responseSchema,
        temperature: opts.temperature ?? 0.35,
        ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
        ...(thinkingConfig ? { thinkingConfig } : {}),
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });

    if (!response.text) {
      throw new Error(`Leere Antwort von ${modelName}`);
    }
    return parseJsonFromModelText<T>(response.text);
  };

  // Durchlauf 1: Alle Schlüssel × geordnete Modelle
  for (const key of keys) {
    const ai = new GoogleGenAI({ apiKey: key });
    for (const modelName of orderedModels) {
      if (Date.now() - startedAt > totalBudgetMs - 4_000) break;
      try {
        const parsed = await tryModel(ai, modelName, true);
        if (parsed) {
          modelCooldownUntil.delete(modelName);
          return { data: parsed, modelUsed: modelName };
        }
      } catch (err) {
        const info = classifyError(err);
        // Falls ein Modell thinkingConfig ablehnt (400), sofort einmal ohne thinkingConfig versuchen
        if (info.kind === "bad_request" && /thinking/i.test(info.raw)) {
          try {
            const parsed = await tryModel(ai, modelName, false);
            if (parsed) {
              modelCooldownUntil.delete(modelName);
              return { data: parsed, modelUsed: modelName };
            }
          } catch (retryErr) {
            lastError = retryErr;
            markModelCooldown(modelName, classifyError(retryErr).kind);
            continue;
          }
        }
        lastError = err;
        if (info.kind === "auth") {
          // Ungültiger Key → direkt nächsten Key probieren (oder abbrechen)
          break;
        }
        markModelCooldown(modelName, info.kind);
      }
    }
  }

  // Durchlauf 2 (Recovery-Runde): Bei transientem 503/429/Timeout kurz warten (Jitter) & High-Volume-Lite-Modelle nochmal versuchen
  const lastKind = classifyError(lastError).kind;
  const remainingAfterPass1 = totalBudgetMs - (Date.now() - startedAt);
  if (
    (lastKind === "overloaded" || lastKind === "rate_limit" || lastKind === "timeout") &&
    remainingAfterPass1 > 10_000
  ) {
    const jitterMs = 1000 + Math.floor(Math.random() * 900);
    await sleep(jitterMs);

    const recoveryModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
    ].filter((m) => baseModels.includes(m) || !parseEnvModels());

    const ai = new GoogleGenAI({ apiKey: keys[0] });
    for (const modelName of recoveryModels) {
      if (Date.now() - startedAt > totalBudgetMs - 4_000) break;
      try {
        const parsed = await tryModel(ai, modelName, false);
        if (parsed) {
          modelCooldownUntil.delete(modelName);
          return { data: parsed, modelUsed: modelName };
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error("Keine Antwort von Gemini erhalten.");
}

/**
 * Wandelt rohe Google-API-Fehler in eine verständliche deutsche Meldung + HTTP-Status um.
 */
export function formatGeminiErrorWithStatus(
  error: unknown,
  fallbackMsg: string
): { message: string; status: number; retryable: boolean } {
  const { kind, raw } = classifyError(error);
  if (kind === "rate_limit") {
    return {
      message:
        "Die KI ist gerade kurz ausgelastet (Anfragelimit erreicht). Bitte versuche es in 15–30 Sekunden erneut.",
      status: 429,
      retryable: true,
    };
  }
  if (kind === "overloaded" || kind === "timeout") {
    return {
      message:
        "Der KI-Dienst ist momentan kurz überlastet. Bitte klicke gleich noch einmal auf Generieren.",
      status: 503,
      retryable: true,
    };
  }
  if (kind === "auth") {
    return {
      message: "API-Schlüssel-Fehler bei Gemini. Bitte prüfe GEMINI_API_KEY in den Einstellungen.",
      status: 500,
      retryable: false,
    };
  }
  return {
    message: raw ? `${fallbackMsg}: ${raw.slice(0, 220)}` : fallbackMsg,
    status: 500,
    retryable: false,
  };
}

/**
 * Abwärtskompatible Wrapper-Funktion für bestehende Aufrufer.
 */
export function formatGeminiError(error: unknown, fallbackMsg: string): string {
  return formatGeminiErrorWithStatus(error, fallbackMsg).message;
}
