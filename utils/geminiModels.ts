import { GoogleGenAI, Schema, ThinkingLevel } from "@google/genai";

// Zentrale, hochverfügbare Gemini-Steuerung:
// 1. Startet mit schnellen High-Volume-Modellen (3.5 Flash-Lite & 3.1 Flash-Lite: je 500/Tag, 15 RPM)
//    und fällt nahtlos auf 3.8 Flash, 3.6 Flash, 2.5 Flash-Lite sowie optional OpenAI zurück.
// 2. Deaktiviert versteckte 5x-SDK-Retries (attempts: 1) für sofortigen Modellwechsel ohne 5x-Quota-Verbrauch.
// 3. Hedged Request (Tail-Latency-Schutz): Wenn Modell 1 nach 8s noch nicht geantwortet hat,
//    startet Modell 2 parallel und die schnellere Antwort gewinnt – ohne Modell 1 zu früh abzubrechen!
// 4. Circuit Breaker überspringt kurzzeitig limitierte/überlastete Modelle automatisch.

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
 * Für komplette Arbeitsblätter, Klassenarbeiten & Partnerarbeiten:
 * Nutzt zuerst 3.5 Flash-Lite (Googles offizieller Nachfolger für 2.5 Flash, 500/Tag)
 * und 3.1 Flash-Lite (500/Tag), mit Fallback auf 3.8 Flash, 3.6 Flash und 2.5 Flash-Lite.
 * Im Paid-Tier kann über GEMINI_MODELS=gemini-3.8-flash,... jederzeit 3.8 Flash priorisiert werden.
 */
export function getGenerateModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.6-flash",
    ]
  );
}

/**
 * Für schnelle Folgeaktionen (Einzelaufgabe anpassen, KI-Feinschliff, Tipp-Karten, Stundenverlauf).
 */
export function getFastModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
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
  return [...healthy, ...cooled];
}

/**
 * Flash-Lite-Modelle (3.5 / 3.1) laufen nativ bereits im schnellsten MINIMAL-Modus –
 * kein thinkingConfig-Override nötig (vermeidet unnötige Latenz und 400-Risiken).
 * Nur 3.8/3.6 Flash werden von MEDIUM auf LOW begrenzt, damit sie nicht 30+ Sekunden grübeln.
 */
function getThinkingConfigForModel(modelName: string) {
  if (modelName === "gemini-3.8-flash" || modelName === "gemini-3.6-flash") {
    return { thinkingLevel: ThinkingLevel.LOW };
  }
  return undefined;
}

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

async function tryOpenAiFallback<T>(
  opts: ResilientJsonOptions,
  timeoutMs: number
): Promise<{ data: T; modelUsed: string } | null> {
  const openAiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!openAiKey) return null;

  const model = (process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
  if (opts.parts.some((p) => "inlineData" in p)) return null;

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
  perAttemptTimeoutMs?: number;
  totalBudgetMs?: number;
}

export async function generateJsonWithFallback<T = Record<string, unknown>>(
  opts: ResilientJsonOptions
): Promise<{ data: T; modelUsed: string }> {
  const keys = opts.apiKey ? [opts.apiKey] : getGeminiApiKeys();
  const hasOpenAi = Boolean((process.env.OPENAI_API_KEY || "").trim());
  const hasInlineBinary = opts.parts.some((p) => "inlineData" in p);

  if (keys.length === 0 && !hasOpenAi) {
    throw new Error("Weder OPENAI_API_KEY noch GEMINI_API_KEY in den Vercel Environment Variables hinterlegt.");
  }

  const baseModels = opts.mode === "fast" ? getFastModels() : getGenerateModels();
  const orderedModels = sortByHealth(baseModels);
  const totalBudgetMs = opts.totalBudgetMs ?? (opts.mode === "fast" ? 28_000 : 50_000);
  const perAttemptMs = opts.perAttemptTimeoutMs ?? (opts.mode === "fast" ? 24_000 : 42_000);
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

  // SCHRITT 0: Wenn OPENAI_API_KEY gesetzt ist (und kein PDF/Foto-Upload vorliegt),
  // läuft OpenAI (gpt-4.1-mini) automatisch als stabiler, extrem schneller Primär-Motor!
  // Fällt OpenAI jemals aus, übernimmt direkt Gemini nahtlos im Anschluss.
  if (hasOpenAi && !hasInlineBinary && (process.env.AI_PROVIDER || "").trim().toLowerCase() !== "gemini") {
    try {
      const openAiResult = await tryOpenAiFallback<T>(
        opts,
        Math.min(28_000, totalBudgetMs - 10_000)
      );
      if (openAiResult) return openAiResult;
    } catch (openAiErr) {
      console.warn(`[LehrReich OpenAI] failed: ${String(openAiErr).slice(0, 160)}`);
      recordError("openai", openAiErr);
    }
  }

  if (keys.length === 0) {
    throw new GeminiAggregateError(lastError || new Error("Keine KI-Antwort erhalten."), trace);
  }

  const createClient = (apiKey: string) =>
    new GoogleGenAI({
      apiKey,
      httpOptions: {
        retryOptions: { attempts: 1 },
      },
    });

  const callModelOnce = async (
    ai: GoogleGenAI,
    modelName: string,
    externalSignal?: AbortSignal
  ): Promise<{ data: T; modelUsed: string }> => {
    const remaining = totalBudgetMs - (Date.now() - startedAt);
    if (remaining < 3_500) {
      throw new Error("TimeoutError: Gesamtbudget erreicht");
    }

    const timeoutMs = Math.min(perAttemptMs, remaining - 500);
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combinedSignal = externalSignal
      ? AbortSignal.any([timeoutSignal, externalSignal])
      : timeoutSignal;

    const thinkingConfig = getThinkingConfigForModel(modelName);

    const runCall = async (includeThinking: boolean) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: opts.parts }],
        config: {
          ...(opts.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
          responseMimeType: "application/json",
          responseSchema: opts.responseSchema,
          temperature: opts.temperature ?? 0.35,
          ...(opts.maxOutputTokens ? { maxOutputTokens: opts.maxOutputTokens } : {}),
          ...(includeThinking && thinkingConfig ? { thinkingConfig } : {}),
          abortSignal: combinedSignal,
        },
      });
      if (!response.text) throw new Error(`Leere Antwort von ${modelName}`);
      return parseJsonFromModelText<T>(response.text);
    };

    try {
      const data = await runCall(true);
      modelCooldownUntil.delete(modelName);
      return { data, modelUsed: modelName };
    } catch (err) {
      const info = classifyError(err);
      if (info.kind === "bad_request" && thinkingConfig && /thinking/i.test(info.raw)) {
        const data = await runCall(false);
        modelCooldownUntil.delete(modelName);
        return { data, modelUsed: modelName };
      }
      throw err;
    }
  };

  // SCHRITT 1: Hedged Fast-Lane über die Top-2 gesunden Gemini-Modelle auf Key 1
  if (orderedModels.length >= 2) {
    const ai = createClient(keys[0]);
    const [m1, m2] = orderedModels;
    const winnerAbort1 = new AbortController();
    const winnerAbort2 = new AbortController();

    const hedgeResult = await new Promise<{ data: T; modelUsed: string } | null>((resolve) => {
      let settled = false;
      let startedM2 = false;
      let failures = 0;
      let hedgeTimer: ReturnType<typeof setTimeout> | null = null;

      const finishWin = (res: { data: T; modelUsed: string }, which: 1 | 2) => {
        if (settled) return;
        settled = true;
        if (hedgeTimer) clearTimeout(hedgeTimer);
        if (which === 1) winnerAbort2.abort();
        else winnerAbort1.abort();
        resolve(res);
      };

      const finishFail = (modelName: string, err: unknown, isFirst: boolean) => {
        if (settled) return;
        const info = classifyError(err);
        console.warn(`[LehrReich Gemini] ${modelName} failed (${info.kind}): ${info.raw.slice(0, 160)}`);
        recordError(modelName, err);
        markModelCooldown(modelName, info.kind);
        failures += 1;

        if (isFirst && !startedM2) {
          if (hedgeTimer) clearTimeout(hedgeTimer);
          launchM2();
          return;
        }
        if (failures >= 2) {
          settled = true;
          if (hedgeTimer) clearTimeout(hedgeTimer);
          resolve(null);
        }
      };

      const launchM2 = () => {
        if (startedM2 || settled) return;
        startedM2 = true;
        callModelOnce(ai, m2, winnerAbort2.signal)
          .then((res) => finishWin(res, 2))
          .catch((err) => finishFail(m2, err, false));
      };

      callModelOnce(ai, m1, winnerAbort1.signal)
        .then((res) => finishWin(res, 1))
        .catch((err) => finishFail(m1, err, true));

      hedgeTimer = setTimeout(launchM2, 8_000);
    });

    if (hedgeResult) return hedgeResult;
  }

  // SCHRITT 2: Übrige Gemini-Modelle (und ggf. weitere API-Keys) sequenziell durchlaufen
  for (let kIdx = 0; kIdx < keys.length; kIdx++) {
    const ai = createClient(keys[kIdx]);
    const listToTry = kIdx === 0 && orderedModels.length >= 2 ? orderedModels.slice(2) : orderedModels;
    for (const modelName of listToTry) {
      if (Date.now() - startedAt > totalBudgetMs - 4_000) break;
      try {
        return await callModelOnce(ai, modelName);
      } catch (err) {
        const info = classifyError(err);
        console.warn(`[LehrReich Gemini] ${modelName} failed (${info.kind}): ${info.raw.slice(0, 160)}`);
        recordError(modelName, err);
        if (info.kind === "auth") break;
        markModelCooldown(modelName, info.kind);
      }
    }
  }

  // SCHRITT 3: Falls AI_PROVIDER=gemini erzwungen war, OpenAI trotzdem als Notfall-Fallback nutzen
  const remainingBeforeOpenAi = totalBudgetMs - (Date.now() - startedAt);
  if (
    hasOpenAi &&
    !hasInlineBinary &&
    (process.env.AI_PROVIDER || "").trim().toLowerCase() === "gemini" &&
    remainingBeforeOpenAi > 8_000
  ) {
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

  throw new GeminiAggregateError(lastError || new Error("Keine Antwort von der KI erhalten."), trace);
}

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

export function formatGeminiError(error: unknown, fallbackMsg: string): string {
  return formatGeminiErrorWithStatus(error, fallbackMsg).message;
}
