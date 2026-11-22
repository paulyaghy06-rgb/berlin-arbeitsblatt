import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const taskItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nummer: { type: Type.INTEGER },
    anforderungsbereich: { type: Type.STRING },
    typ: { type: Type.STRING },
    punkte: { type: Type.INTEGER },
    text: { type: Type.STRING },
    schreiblinien: { type: Type.INTEGER },
  },
  required: ["nummer", "anforderungsbereich", "typ", "punkte", "text", "schreiblinien"],
};

const tableSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    spalten: { type: Type.ARRAY, items: { type: Type.STRING } },
    zeilen: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
  },
};

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING },
    untertitel: { type: Type.STRING },
    materialTyp: { type: Type.STRING },
    infoboxTitel: { type: Type.STRING },
    einstiegstext: { type: Type.STRING },
    schaubildSvg: { type: Type.STRING },
    tabelle: tableSchema,
    wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
    aufgaben: {
      type: Type.ARRAY,
      items: taskItemSchema,
    },
    musterloesung: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          loesung: { type: Type.STRING },
        },
        required: ["nummer", "loesung"],
      },
    },
  },
  required: ["titel", "untertitel", "materialTyp", "einstiegstext", "aufgaben", "musterloesung"],
};

const partnerWorksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING },
    untertitel: { type: Type.STRING },
    ablaufHinweis: { type: Type.STRING },
    isPartnerarbeit: { type: Type.BOOLEAN },
    partnerModus: { type: Type.STRING },
    materialTyp: { type: Type.STRING },
    infoboxTitel: { type: Type.STRING },
    einstiegstext: { type: Type.STRING },
    tabelle: tableSchema,
    wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
    aufgaben: {
      type: Type.ARRAY,
      items: taskItemSchema,
    },
    partnerB: {
      type: Type.OBJECT,
      properties: {
        untertitel: { type: Type.STRING },
        materialTyp: { type: Type.STRING },
        infoboxTitel: { type: Type.STRING },
        einstiegstext: { type: Type.STRING },
        tabelle: tableSchema,
        wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
        aufgaben: {
          type: Type.ARRAY,
          items: taskItemSchema,
        },
      },
      required: ["untertitel", "materialTyp", "infoboxTitel", "einstiegstext", "aufgaben"],
    },
    musterloesung: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          loesung: { type: Type.STRING },
        },
        required: ["nummer", "loesung"],
      },
    },
  },
  required: [
    "titel",
    "untertitel",
    "ablaufHinweis",
    "materialTyp",
    "infoboxTitel",
    "einstiegstext",
    "aufgaben",
    "partnerB",
    "musterloesung",
  ],
};

function normalizeTasks(aufgaben: unknown): unknown {
  if (!Array.isArray(aufgaben)) return aufgaben;
  return aufgaben.map((a: Record<string, unknown>, idx: number) => {
    const typLower = String(a.typ || "").toLowerCase();
    const isNoLines = typLower.includes("multiple") || typLower.includes("lückentext");
    return {
      ...a,
      nummer: idx + 1,
      ...(isNoLines ? { schreiblinien: 0 } : {}),
    };
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY fehlt." }, { status: 500 });
    }

    const { worksheet, instruction, fach, klassenstufe } = await req.json();
    if (!worksheet || !instruction?.trim()) {
      return NextResponse.json({ error: "Arbeitsblatt oder Änderungsanweisung fehlt." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const isPartner = Boolean(worksheet.isPartnerarbeit && worksheet.partnerB);
    const isMath = String(fach || "").toLowerCase().includes("mathe");

    const prompt = [
      "Du bist ein erfahrener Fachlehrer und Didaktik-Experte.",
      isPartner
        ? "Überarbeite das bestehende 2-Seiten-Partnerarbeit-Set (Blatt A UND partnerB) gezielt gemäß der Anweisung der Lehrkraft."
        : "Überarbeite das bestehende Arbeitsblatt (JSON) gezielt gemäß der Anweisung der Lehrkraft.",
      "",
      "ANWEISUNG DER LEHRKRAFT:",
      instruction.trim(),
      "",
      "REGELN FÜR DIE ÜBERARBEITUNG:",
      "1. Ändere NUR die Teile, die von der Anweisung betroffen sind – bewahre alle übrigen Aufgaben, Texte und Strukturen unverändert!",
      isPartner
        ? "2. WICHTIG PARTNERARBEIT: Bewahre sowohl Blatt A als auch partnerB (Seite 2) und ablaufHinweis vollständig und komplementär!"
        : "",
      "3. Formuliere Aufgabenstellungen klar, kurz und schülergerecht für " + (klassenstufe || "die Klasse") + " (" + (fach || "Unterricht") + ").",
      "4. Setze Operatoren in doppelte Sternchen (**Operator**).",
      "5. Nummeriere aufgaben und musterloesung sauber von 1 bis N durch und halte musterloesung synchron mit aufgaben.",
      "6. Bei Multiple-Choice- oder Lückentext-Aufgaben gilt immer schreiblinien: 0.",
      isMath
        ? "7. MATHEMATIK: Verwende echte Rechenaufgaben mit sauberen Unicode-Zeichen (·, :, −, ², ³, √, π, ≤, ≥, °, ≈, Brüche als 3/4), NIEMALS rohen LaTeX-Code wie \\frac oder $...$."
        : "",
      "",
      "AKTUELLES ARBEITSBLATT (JSON):",
      JSON.stringify(worksheet),
    ]
      .filter(Boolean)
      .join("\n");

    const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    let lastError: unknown = null;

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: isPartner ? partnerWorksheetSchema : worksheetSchema,
            temperature: isMath ? 0.25 : 0.3,
            maxOutputTokens: 8192,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          parsed.aufgaben = normalizeTasks(parsed.aufgaben);
          if (isPartner) {
            parsed.isPartnerarbeit = true;
            parsed.partnerModus = worksheet.partnerModus || parsed.partnerModus || "tandem";
            if (parsed.partnerB) {
              parsed.partnerB.aufgaben = normalizeTasks(parsed.partnerB.aufgaben);
            }
          }
          return NextResponse.json(parsed);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Keine Antwort von Gemini erhalten.");
  } catch (error) {
    const message = error instanceof Error ? "API-Fehler: " + error.message : "Unbekannter Fehler.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
