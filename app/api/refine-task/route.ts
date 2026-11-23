import { GoogleGenAI, Type, Schema } from "@google/genai";
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

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY fehlt." }, { status: 500 });
    }

    const { action, taskText, currentSolution, contextText, fach, klassenstufe, titel } = await req.json();
    const cleanInputTask = (taskText || "").replace(/^\s*\d+\.\s*/, "").trim();
    const ai = new GoogleGenAI({ apiKey });

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

${cleanInputTask ? `BISHERIGE AUFGABE (DARF NICHT WIEDERHOLT WERDEN – formuliere eine echte neue Fragestellung auf dem gewünschten Niveau!):\n"${cleanInputTask}"\n\nBISHERIGE LÖSUNG:\n"${currentSolution || ""}"` : ""}

REGELN:
1. Beginne "text" NIEMALS mit einer Zahl wie "1." oder "2.".
2. Setze den Operator in doppelte Sternchen (**Operator**).
3. Passe "anforderungsbereich" (AFB I, AFB II oder AFB III) und "loesung" exakt an die neue Aufgabe an.
`;

    const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    let lastError: unknown = null;

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: refineSchema,
            temperature: 0.75,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          parsed.text = (parsed.text || "").replace(/^\s*\d+\.\s*/, "").trim();
          const { setCookieHeader } = await recordUsageEvent(req, billing.userId, "refine");
          return NextResponse.json(parsed, {
            headers: { "Set-Cookie": setCookieHeader },
          });
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Keine Antwort erhalten.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fehler bei der Aufgaben-Anpassung.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
