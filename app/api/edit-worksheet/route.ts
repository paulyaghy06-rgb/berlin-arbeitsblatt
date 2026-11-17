import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING },
    untertitel: { type: Type.STRING },
    materialTyp: { type: Type.STRING },
    einstiegstext: { type: Type.STRING },
    schaubildSvg: { type: Type.STRING },
    tabelle: {
      type: Type.OBJECT,
      properties: {
        spalten: { type: Type.ARRAY, items: { type: Type.STRING } },
        zeilen: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
      },
    },
    wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
    aufgaben: {
      type: Type.ARRAY,
      items: {
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
      },
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

    const prompt = [
      "Du bist ein erfahrener Fachlehrer und Didaktik-Experte.",
      "Überarbeite das bestehende Arbeitsblatt (JSON) gezielt gemäß der Anweisung der Lehrkraft.",
      "",
      "ANWEISUNG DER LEHRKRAFT:",
      instruction.trim(),
      "",
      "REGELN FÜR DIE ÜBERARBEITUNG:",
      "1. Ändere NUR die Teile, die von der Anweisung betroffen sind – bewahre alle übrigen Aufgaben, Texte und Strukturen unverändert!",
      "2. Formuliere Aufgabenstellungen klar, kurz und schülergerecht für " + (klassenstufe || "die Klasse") + " (" + (fach || "Unterricht") + ").",
      "3. Setze Operatoren in doppelte Sternchen (**Operator**).",
      "4. Nummeriere aufgaben und musterloesung sauber von 1 bis N durch und halte musterloesung synchron mit aufgaben.",
      "5. Bei Multiple-Choice- oder Lückentext-Aufgaben gilt immer schreiblinien: 0.",
      "",
      "AKTUELLES ARBEITSBLATT (JSON):",
      JSON.stringify(worksheet),
    ].join("\n");

    const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    let lastError: unknown = null;

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: worksheetSchema,
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed.aufgaben)) {
            parsed.aufgaben = parsed.aufgaben.map((a: Record<string, unknown>, idx: number) => {
              const typLower = String(a.typ || "").toLowerCase();
              const isNoLines = typLower.includes("multiple") || typLower.includes("lückentext");
              return {
                ...a,
                nummer: idx + 1,
                ...(isNoLines ? { schreiblinien: 0 } : {}),
              };
            });
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
