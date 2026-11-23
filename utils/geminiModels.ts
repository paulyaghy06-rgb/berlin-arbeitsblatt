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
 * Nutzt zuerst die stärksten Flash-Modelle (höchste Qualität: 3.8 Flash & 3.6 Flash)
 * und fällt bei 5-RPM-/20-RPD-Limit oder 503 dank Circuit Breaker sofort und nahtlos
 * auf die High-Volume Flash-Lite-Modelle (500/Tag pro Modell) zurück.
 * Enthält ausschließlich verifizierte v1-GA-Modelle (kein 404 durch Preview-IDs!).
 */
export function getGenerateModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
    ]
  );
}

/**
 * Für schnelle Folgeaktionen (Einzelaufgabe anpassen, KI-Feinschliff,
 * Tipp-Karten & Stundenverlauf): schont das 3.8/3.6-Flash-Kontingent für volle Arbeitsblätter.
 */
export function getFastModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.6-flash",
    ]
  );
}

function classifyError(error: unknown): {
  kind: "rate_limit" | "overloaded" | "not_found" | "timeout" | "auth" | "bad_request" | "other";
  code: string;
  raw: string;
} {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error || "");
  if (
    raw.includes("401") ||
    raw.includes("403") ||
    /API_KEY_INVALID|PERMISSION_DENIED/i.test(raw)
  ) {
    return { kind: "auth", code: "401/403", raw };
  }
  if (raw.includes("429") || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return { kind: "rate_limit", code: "429", raw };
  }
  if (raw.includes("503") || raw.includes("502") || /UNAVAILABLE|overloaded|high demand/i.test(raw)) {
    return { kind: "overloaded", code: "503", raw };
  }
  if (raw.includes("404") || /NOT_FOUND|no longer available/i.test(raw)) {
    return { kind: "not_found", code: "404", raw };
  }
  if (/AbortError|TimeoutError|timed out|aborted/i.test(raw)) {
    return { kind: "timeout", code: "TIMEOUT", raw };
  }
  if (raw.includes("400") || /INVALID_ARGUMENT/i.test(raw)) {
    return { kind: "bad_request", code: "400", raw };
  }
  return { kind: "other", code: "ERR", raw };
}

function markModelCooldown(modelName: string, kind: ReturnType<typeof classifyError>["kind"]) {
  const now = Date.now();
  if (kind === "not_found") {
    modelCooldownUntil.set(modelName, now + 15 * 60 * 1000);
  } else if (kind === "rate_limit") {
    modelCooldownUntil.set(modelName, now + 70 * 1000);
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
  return [...healthy, ...cooled];
}

function getThinkingConfigForModel(modelName: string, mode: "generate" | "fast") {
  if (modelName.startsWith("gemini-2.5")) {
    return { thinkingBudget: 0 };
  }
  if (modelName.startsWith("gemini-3")) {
    return {
      thinkingLevel:
        mode === "fast" || modelName.includes("lite")
          ? ThinkingLevel.MINIMAL
          : ThinkingLevel.LOW,
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

class GeminiAggregateError extends Error {
  causeError: unknown;
  trace: string[];
  constructor(causeError: unknown, trace: string[]) {
    super(causeError instanceof Error ? causeError.message : String(causeError || "Gemini Fehler"));
    this.name = "GeminiAggregateError";
    this.causeError = causeError;
    this.trace = trace;
  }
}

/**
 * Optionaler Multi-Provider-Fallback über OpenAI (nur aktiv, wenn OPENAI_API_KEY in Vercel gesetzt ist).
 * Schützt bei globalen Google-503-Wellen zu 100 % vor Ausfällen.
 */
async function tryOpenAiFallback<T>(
  opts: ResilientJsonOptions,
  timeoutMs: number
): Promise<{ data: T; modelUsed: string } | null> {
  const openAiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!openAiKey) return null;

  const model = (process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
  const hasInlineBinary = opts.parts.some((p) => "inlineData" in p);
  // Bei PDF-Uploads ohne Vision-Konvertierung OpenAI-Text-Fallback überspringen
  if (hasInlineBinary) return null;

  const userText = opts.parts
    .map((p) => ("text" in p ? p.text : ""))
    .filter(Boolean)
    .join("\n\n");

  const systemText = [
    opts.systemInstruction || "",
    "WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt gemäß folgendem Schema (ohne Markdown-Codeblöcke):",
    JSON.stringify(opts.responseSchema),
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: userText },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${errBody.slice(0, 160)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Leere Antwort von OpenAI");
  return { data: parseJsonFromModelText<T>(content), modelUsed: `openai:${model}` };
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
 * - Deaktiviert versteckte 5x-SDK-Retries (attempts: 1) für sofortiges Failover (<0,5s)
 * - Überspringt temporär überlastete/limitierte Modelle (Circuit Breaker)
 * - Fällt über 3.8/3.6 Flash → 3.5/3.1 Flash-Lite → 2.5 Flash-Lite → optional OpenAI zurück
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
  const perAttemptMs = opts.perAttemptTimeoutMs ?? (opts.mode === "fast" ? 18_000 : 26_000);
  const totalBudgetMs = opts.totalBudgetMs ?? (opts.mode === "fast" ? 28_000 : 50_000);
  const startedAt = Date.now();

  let lastError: unknown = null;
  const trace: string[] = [];

  const recordError = (modelName: string, err: unknown) => {
    const info = classifyError(err);
    trace.push(`${modelName.replace(/^gemini-/, "")}:${info.code}`);
    const prevKind = lastError ? classifyError(lastError).kind : null;
    if (info.kind === "not_found" && (prevKind === "rate_limit" || prevKind === "overloaded")) {
      return;
    }
    lastError = err;
  };

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

  // WICHTIG: @google/genai v3 macht standardmäßig 5 interne Retries (1s+2s+4s+8s) pro Modell!
  // Mit retryOptions: { attempts: 1 } schaltet jeder Fehler sofort (<0,5s) aufs nächste gesunde Modell um.
  const createClient = (apiKey: string) =>
    new GoogleGenAI({
      apiKey,
      httpOptions: {
        retryOptions: { attempts: 1 },
      },
    });

  // Durchlauf 1: Alle Schlüssel × geordnete Modelle (je genau 1 schneller Versuch pro Modell)
  for (const key of keys) {
    const ai = createClient(key);
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
        console.warn(`[LehrReich Gemini] ${modelName} failed (${info.kind}): ${info.raw.slice(0, 160)}`);
        if (info.kind === "bad_request" && /thinking/i.test(info.raw)) {
          try {
            const parsed = await tryModel(ai, modelName, false);
            if (parsed) {
              modelCooldownUntil.delete(modelName);
              return { data: parsed, modelUsed: modelName };
            }
          } catch (retryErr) {
            recordError(modelName, retryErr);
            markModelCooldown(modelName, classifyError(retryErr).kind);
            continue;
          }
        }
        recordError(modelName, err);
        if (info.kind === "auth") {
          break;
        }
        markModelCooldown(modelName, info.kind);
      }
    }
  }

  // Optionaler OpenAI-Notfall-Fallback (falls OPENAI_API_KEY in Vercel hinterlegt ist)
  const remainingBeforeOpenAi = totalBudgetMs - (Date.now() - startedAt);
  if (remainingBeforeOpenAi > 8_000 && (process.env.OPENAI_API_KEY || "").trim()) {
    try {
      const openAiResult = await tryOpenAiFallback<T>(
        opts,
        Math.min(20_000, remainingBeforeOpenAi - 1_000)
      );
      if (openAiResult) return openAiResult;
    } catch (openAiErr) {
      recordError("openai", openAiErr);
    }
  }

  // Durchlauf 2 (Recovery-Runde): Bei transientem 503/429 kurz warten (Jitter) & Lite-Modelle ohne Thinking nochmal versuchen
  const lastKind = classifyError(lastError).kind;
  const remainingAfterPass1 = totalBudgetMs - (Date.now() - startedAt);
  if (
    (lastKind === "overloaded" || lastKind === "rate_limit") &&
    remainingAfterPass1 > 10_000
  ) {
    const jitterMs = 1000 + Math.floor(Math.random() * 800);
    await sleep(jitterMs);

    const recoveryModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
    ].filter((m) => baseModels.includes(m) || !parseEnvModels());

    const ai = createClient(keys[0]);
    for (const modelName of recoveryModels) {
      if (Date.now() - startedAt > totalBudgetMs - 4_000) break;
      try {
        const parsed = await tryModel(ai, modelName, false);
        if (parsed) {
          modelCooldownUntil.delete(modelName);
          return { data: parsed, modelUsed: modelName };
        }
      } catch (err) {
        recordError(modelName, err);
      }
    }
  }

  throw new GeminiAggregateError(lastError || new Error("Keine Antwort von Gemini erhalten."), trace);
}

/**
 * Wandelt rohe Google-API-Fehler in eine verständliche deutsche Meldung + HTTP-Status um.
 */
export function formatGeminiErrorWithStatus(
  error: unknown,
  fallbackMsg: string
): { message: string; status: number; retryable: boolean } {
  const agg = error instanceof GeminiAggregateError ? error : null;
  const inner = agg ? agg.causeError : error;
  const traceHint =
    agg && agg.trace.length > 0 ? ` [${agg.trace.slice(0, 6).join(" · ")}]` : "";

  const { kind, raw } = classifyError(inner);
  if (kind === "rate_limit") {
    return {
      message: `Die KI ist gerade kurz ausgelastet (Anfragelimit erreicht). Bitte versuche es in 15–30 Sekunden erneut.${traceHint}`,
      status: 429,
      retryable: true,
    };
  }
  if (kind === "timeout") {
    return {
      message: `Die KI hat gerade ungewöhnlich lange gebraucht (Zeitüberschreitung). Bitte klicke noch einmal auf Generieren.${traceHint}`,
      status: 504,
      retryable: true,
    };
  }
  if (kind === "overloaded") {
    return {
      message: `Google Gemini meldet momentan auf allen Modellen eine kurzzeitige Überlastung. Bitte klicke gleich noch einmal auf Generieren.${traceHint}`,
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
    message: raw ? `${fallbackMsg}: ${raw.slice(0, 220)}${traceHint}` : `${fallbackMsg}${traceHint}`,
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
