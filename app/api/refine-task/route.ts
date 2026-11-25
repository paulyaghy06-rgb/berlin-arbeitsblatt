import { Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getBillingSnapshot,
  getClientIp,
  recordUsageEvent,
} from "@/utils/serverBilling";
import {
  buildGradeDidacticsInstruction,
  buildSubjectDidacticsInstruction,
  isMathSubject,
} from "@/utils/didacticsEngine";
import {
  formatGeminiErrorWithStatus,
  generateJsonWithFallback,
  getGeminiApiKeys,
} from "@/utils/geminiModels";

export const maxDuration = 30;

const refineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description:
        "Komplett neu formulierter Aufgabentext OHNE vorangestellte Aufgabennummer, mit fettgedrucktem Operator (**Operator**)",
    },
    anforderungsbereich: {
      type: Type.STRING,
      description: "AFB I, AFB II oder AFB III",
    },
    loesung: {
      type: Type.STRING,
      description: "Passende Musterlösung zur neu formulierten Aufgabe",
    },
  },
  required: ["text", "anforderungsbereich", "loesung"],
};

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`refine:${ip}`, 35, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Zu viele Anfragen in kurzer Zeit. Bitte warte einen kurzen Moment.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    const billing = await getBillingSnapshot(req);
    if (
      billing.billingLive &&
      billing.plan !== "pro" &&
      billing.usage.refinesLimit !== null &&
      billing.usage.refinesUsed >= billing.usage.refinesLimit
    ) {
      return NextResponse.json(
        {
          error: billing.authenticated
            ? `Du hast dein monatliches Kontingent von ${billing.usage.refinesLimit} kostenlosen KI-Anpassungen erreicht. Mit LehrReich Studio Pro kannst du unbegrenzt verfeinern.`
            : `Du hast deine ${billing.usage.refinesLimit} kostenlosen Test-Anpassungen verbraucht. Melde dich kostenlos an oder wechsle auf LehrReich Studio Pro.`,
          code: "LIMIT_REACHED",
          authenticated: billing.authenticated,
          used: billing.usage.refinesUsed,
          limit: billing.usage.refinesLimit,
        },
        { status: 402 }
      );
    }

    if (getGeminiApiKeys().length === 0) {
      return NextResponse.json({ error: "GEMINI_API_KEY fehlt." }, { status: 500 });
    }

    const {
      action,
      taskText,
      currentSolution,
      contextText,
      fach,
      klassenstufe,
      titel,
      customPrompt,
      existingTasks,
    } = await req.json();
    const cleanInputTask = (taskText || "").replace(/^\s*\d+\.\s*/, "").trim();
    const cleanCustomWish = typeof customPrompt === "string" ? customPrompt.trim().slice(0, 300) : "";
    const existingList = Array.isArray(existingTasks)
      ? existingTasks
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .slice(0, 12)
      : [];

    const isMath = isMathSubject(fach || "");
    const gradeProfile = buildGradeDidacticsInstruction(klassenstufe || "Klasse 7", "");
    const subjectProfile = buildSubjectDidacticsInstruction(fach || "", klassenstufe || "Klasse 7", isMath);

    const instruction = isMath
      ? action === "easier"
        ? "Erstelle eine DEUTLICH einfachere konkrete RECHENAUFGABE (Basisniveau / AFB I): Nutze kleinere, übersichtliche Zahlen, kleinschrittige Teilaufgaben a), b) mit kurzem Tipp und einem klaren Operator wie **Berechne** oder **Löse**."
        : action === "harder"
        ? "Erstelle eine DEUTLICH anspruchsvollere konkrete RECHEN- oder SACH-AUFGABE (Expertenniveau / AFB III): z. B. mehrschrittige Anwendungsaufgabe, Umkehraufgabe oder Fehlersuche mit Begründung und Operator wie **Berechne und begründe**, **Überprüfe** oder **Bestimme**."
        : "Erstelle eine komplett neue, konkrete RECHENAUFGABE passend zum Thema des Arbeitsblatts (mit konkreten Zahlen/Termen, z. B. mit Teilaufgaben a), b), c) und Rechenweg in der Lösung)."
      : action === "easier"
      ? "Erstelle eine DEUTLICH einfachere Version dieser Aufgabe (Basisniveau / AFB I): Verwende einfache, kurze Sätze, baue eine konkrete Hilfestellung (z. B. Stichwörter oder Satzanfänge) ein und nutze einen einfachen Operator."
      : action === "harder"
      ? "Erstelle eine DEUTLICH anspruchsvollere Version dieser Aufgabe (Expertenniveau / AFB III): Ersetze die bisherige Fragestellung durch eine komplexe Analyse-, Transfer- oder Urteilsaufgabe mit einem AFB-III-Operator und verlange eine begründete Argumentation."
      : "Erstelle eine komplett neue, abwechslungsreiche Zusatzaufgabe passend zum Thema und Material des Arbeitsblatts.";

    const prompt = `
Du bist ein erfahrener Fachlehrer (${fach}, ${klassenstufe}).
Thema des Arbeitsblatts: "${titel}".
${contextText ? `Material / Einstiegstext des Arbeitsblatts:\n"""\n${contextText.slice(0, 1200)}\n"""` : ""}

${gradeProfile}
${subjectProfile}

AUFTRAG:
${instruction}
${cleanCustomWish ? `\nKONKRETER WUNSCH DER LEHRKRAFT FÜR DIESE AUFGABE (hat oberste Priorität):\n"${cleanCustomWish}"` : ""}
${existingList.length > 0 ? `\nBEREITS VORHANDENE AUFGABEN AUF DEM BLATT (NICHT wiederholen, sondern sinnvoll ergänzen!):\n${existingList.map((t, i) => `${i + 1}. ${t.slice(0, 180)}`).join("\n")}` : ""}
${cleanInputTask ? `\nBISHERIGE AUFGABE (DARF NICHT WIEDERHOLT WERDEN – formuliere eine echte neue Fragestellung auf dem gewünschten Niveau!):\n"${cleanInputTask}"\n\nBISHERIGE LÖSUNG:\n"${currentSolution || ""}"` : ""}

REGELN:
1. Beginne "text" NIEMALS mit einer Zahl wie "1." oder "2.".
2. Setze den Operator in doppelte Sternchen (**Operator**).
3. Passe "anforderungsbereich" (AFB I, AFB II oder AFB III) und "loesung" exakt an die neue Aufgabe an.
`;

    const { data: parsed } = await generateJsonWithFallback<{
      text?: string;
      [key: string]: unknown;
    }>({
      mode: "fast",
      parts: [{ text: prompt }],
      responseSchema: refineSchema,
      temperature: 0.75,
      totalBudgetMs: 24_000,
    });

    parsed.text = (parsed.text || "").replace(/^\s*\d+\.\s*/, "").trim();
    const { setCookieHeader } = await recordUsageEvent(req, billing.userId, "refine");
    return NextResponse.json(parsed, {
      headers: { "Set-Cookie": setCookieHeader },
    });
  } catch (error) {
    const { message, status, retryable } = formatGeminiErrorWithStatus(
      error,
      "Fehler bei der Aufgaben-Anpassung"
    );
    return NextResponse.json({ error: message, retryable }, { status });
  }
}
