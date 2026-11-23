import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getBillingSnapshot,
  getClientIp,
  recordUsageEvent,
} from "@/utils/serverBilling";
import { buildGradeDidacticsInstruction, isForeignLanguage } from "@/utils/didacticsEngine";
import { formatGeminiError, getFastModels } from "@/utils/geminiModels";

export const maxDuration = 45;

const tippKartenSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    karten: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          aufgabeNummer: { type: Type.INTEGER },
          titel: { type: Type.STRING, description: "Kurzer Titel, z. B. 'Hilfe zu Aufgabe 1'" },
          tipp1: {
            type: Type.STRING,
            description: "Stufe 1 (Denkanstoß): Kurzer Impuls ohne Lösung zu verraten (1–2 Sätze)",
          },
          tipp2: {
            type: Type.STRING,
            description:
              "Stufe 2 (Konkrete Hilfe): Satzanfänge, Formel, erster Rechenschritt oder Schlüsselbegriffe",
          },
        },
        required: ["aufgabeNummer", "titel", "tipp1", "tipp2"],
      },
    },
  },
  required: ["karten"],
};

const stundenverlaufSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dauerMinuten: { type: Type.INTEGER },
    stundenziel: {
      type: Type.STRING,
      description: "Präzises, kompetenzorientiertes Stundenziel (1–2 Sätze)",
    },
    phasen: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING, description: "z. B. Einstieg, Erarbeitung I, Sicherung" },
          zeit: { type: Type.STRING, description: "z. B. 5 Min." },
          lehrkraft: { type: Type.STRING, description: "Konkreter Impuls / Aktivität der Lehrkraft" },
          schueler: { type: Type.STRING, description: "Konkrete Aktivität der Schülerinnen und Schüler" },
          sozialform: { type: Type.STRING, description: "z. B. Plenum, Einzelarbeit, Partnerarbeit" },
          material: { type: Type.STRING, description: "z. B. Arbeitsblatt, Tafel, Hilfekarten" },
        },
        required: ["phase", "zeit", "lehrkraft", "schueler", "sozialform", "material"],
      },
    },
    differenzierung: {
      type: Type.STRING,
      description: "Konkreter Tipp für schwächere und stärkere Lernende (2–3 Sätze)",
    },
    tafelbild: {
      type: Type.STRING,
      description: "Kompakter Vorschlag für Tafelanschrift / Sicherungsergebnis",
    },
  },
  required: ["dauerMinuten", "stundenziel", "phasen", "differenzierung", "tafelbild"],
};

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`extras:${ip}`, 30, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment.", code: "RATE_LIMITED" },
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
            ? `Du hast dein monatliches Kontingent von ${billing.usage.refinesLimit} kostenlosen KI-Zusatzfunktionen erreicht. Mit LehrReich Studio Pro kannst du unbegrenzt Hilfekarten & Stundenverläufe erstellen.`
            : `Du hast deine ${billing.usage.refinesLimit} kostenlosen Test-Aktionen verbraucht. Melde dich kostenlos an oder wechsle auf LehrReich Studio Pro.`,
          code: "LIMIT_REACHED",
          authenticated: billing.authenticated,
        },
        { status: 402 }
      );
    }

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY fehlt." }, { status: 500 });
    }

    const body = await req.json();
    const { mode, worksheet, fach, klassenstufe, schulform, dauerMinuten = 45 } = body;

    if (!worksheet || !Array.isArray(worksheet.aufgaben)) {
      return NextResponse.json({ error: "Kein Arbeitsblatt vorhanden." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const models = getFastModels();
    let lastError: unknown = null;

    const tasksSummary = worksheet.aufgaben
      .map((a: { nummer: number; text: string; anforderungsbereich?: string }) => `${a.nummer}. [${a.anforderungsbereich || "AFB"}] ${a.text}`)
      .join("\n");

    const gradeHint = buildGradeDidacticsInstruction(klassenstufe || "Klasse 7", schulform || "");
    const langInfo = isForeignLanguage(fach || "");

    if (mode === "tippkarten") {
      const prompt = [
        `Du bist ein erfahrener Fachlehrer (${fach || "Unterricht"}, ${klassenstufe || ""}).`,
        "Erstelle zu JEDER Aufgabe des folgenden Arbeitsblatts eine gestufte, schülergerechte Hilfekarte zum Ausschneiden und Auslegen am Lehrerpult.",
        "",
        gradeHint,
        langInfo.isLang && !langInfo.isLatin
          ? `FREMDSPRACHEN-HINWEIS: Formuliere Hilfen passend zum ${langInfo.langName}-Arbeitsblatt (kurze Hilfestellung / sentence starters auf ${langInfo.langName}, bei Bedarf mit deutscher Erklärung in Klammern).`
          : "",
        "SCHREIBWEISE: Nutze bei Mathe/Chemie saubere Unicode-Zeichen (·, :, −, ², ³, H₂O, →), NIEMALS rohen LaTeX-Code.",
        "",
        `ARBEITSBLATT-TITEL: ${worksheet.titel}`,
        worksheet.einstiegstext ? `MATERIAL-AUSZUG: ${String(worksheet.einstiegstext).slice(0, 600)}` : "",
        "AUFGABEN:",
        tasksSummary,
        "",
        "REGELN:",
        "- Erstelle genau eine Karte pro Aufgabe (aufgabeNummer 1 bis N).",
        "- tipp1 = kurzer, ermutigender Denkanstoß / Strategie-Tipp (verrät NICHT die ganze Lösung!).",
        "- tipp2 = konkrete Unterstützung (z. B. Satzanfänge, Formel, erster Rechenschritt oder Schlüsselwörter).",
      ]
        .filter(Boolean)
        .join("\n");

      for (const modelName of models) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: tippKartenSchema,
              temperature: 0.4,
            },
          });
          if (response.text) {
            const parsed = JSON.parse(response.text);
            const { setCookieHeader } = await recordUsageEvent(req, billing.userId, "refine");
            return NextResponse.json(parsed, { headers: { "Set-Cookie": setCookieHeader } });
          }
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error("Tipp-Karten konnten nicht erstellt werden.");
    }

    if (mode === "stundenverlauf") {
      const mins = Number(dauerMinuten) === 90 ? 90 : 45;
      const prompt = [
        `Du bist ein erfahrener Fachseminarleiter und Didaktiker (${fach || "Unterricht"}, ${klassenstufe || ""}, ${schulform || ""}).`,
        `Erstelle eine praxisnahe, sofort einsetzbare Unterrichtsverlaufsplanung für eine ${mins}-Minuten-Stunde, die perfekt um das vorliegende Arbeitsblatt aufgebaut ist.`,
        "",
        `ARBEITSBLATT-TITEL: ${worksheet.titel}`,
        worksheet.isPartnerarbeit ? "FORMAT: Partnerarbeit (Blatt A & Blatt B)" : "FORMAT: Arbeitsblatt / Übung",
        worksheet.einstiegstext ? `MATERIAL-AUSZUG: ${String(worksheet.einstiegstext).slice(0, 600)}` : "",
        "AUFGABEN DES BLATTS:",
        tasksSummary,
        "",
        "REGELN:",
        `- Die Summe aller Zeitangaben in 'phasen' MUSS exakt ${mins} Minuten ergeben!`,
        "- Typischer, schulpraxistauglicher Ablauf: Einstieg/Problemstellung → Erarbeitung (mit dem Arbeitsblatt) → Austausch/Vertiefung → Sicherung/Reflexion.",
        "- Formuliere jede Phase konkret und knapp (keine abstrakten Floskeln, sondern echte Arbeitsanweisungen für den Unterricht).",
        "- Gib unter 'differenzierung' konkrete Hinweise für schwächere und schnellere Lernende und unter 'tafelbild' ein klares Sicherungsgerüst an.",
      ]
        .filter(Boolean)
        .join("\n");

      for (const modelName of models) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: stundenverlaufSchema,
              temperature: 0.4,
            },
          });
          if (response.text) {
            const parsed = JSON.parse(response.text);
            const { setCookieHeader } = await recordUsageEvent(req, billing.userId, "refine");
            return NextResponse.json(parsed, { headers: { "Set-Cookie": setCookieHeader } });
          }
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error("Stundenverlauf konnte nicht erstellt werden.");
    }

    return NextResponse.json({ error: "Unbekannter Modus." }, { status: 400 });
  } catch (error) {
    const message = formatGeminiError(error, "Fehler bei den Unterrichts-Extras");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
