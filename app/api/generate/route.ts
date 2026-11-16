import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING, description: "Prägnanter Titel des Arbeitsblatts" },
    untertitel: { type: Type.STRING, description: "Fach, Thema und Klassenstufe" },
    einstiegstext: {
      type: Type.STRING,
      description: "Informationstext, Fallbeispiel oder Quellentext (ca. 150-260 Wörter), altersgerecht und sprachsensibel verfasst",
    },
    wortliste: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Nur bei DaZ/Basisniveau: 4-6 schwierige Fachbegriffe kurz und einfach erklärt",
    },
    aufgaben: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          anforderungsbereich: { type: Type.STRING, description: "AFB I, AFB II oder AFB III" },
          typ: { type: Type.STRING, description: "Aufgabentyp wie Lückentext, Multiple-Choice, Analyse, Pro/Kontra" },
          punkte: { type: Type.INTEGER, description: "Erreichbare Punktzahl für diese Aufgabe (z. B. 4, 6, 8, 10)" },
          text: {
            type: Type.STRING,
            description: "Aufgabenstellung mit fettgedrucktem Operator (**Nenne**, **Erkläre**, **Beurteile**). Bei Lückentexten oder Multiple-Choice hier den kompletten Aufgabentext inkl. Lücken (______) oder Optionen (a, b, c) einfügen.",
          },
          schreiblinien: { type: Type.INTEGER, description: "Anzahl der benötigten Schreiblinien (0 bei Multiple-Choice/Lückentext, sonst 3-7)" },
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
          loesung: { type: Type.STRING, description: "Konkreter Erwartungshorizont für die Lehrkraft inkl. Punkteverteilung" },
        },
        required: ["nummer", "loesung"],
      },
    },
  },
  required: ["titel", "untertitel", "einstiegstext", "aufgaben", "musterloesung"],
};

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY fehlt in den Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      modus,
      regionLabel,
      lehrplanName,
      fach,
      schulform,
      klassenstufe,
      thema,
      freiesThema,
      eigenerText,
      fileData,
      niveau,
      aufgabentypen,
      dauer,
      isExam,
      zusatzwuensche,
    } = body;

    const ai = new GoogleGenAI({ apiKey });

    const zielThema = modus === "frei" && freiesThema ? freiesThema : thema;
    const gewuenschteTypen =
      aufgabentypen && aufgabentypen.length > 0
        ? aufgabentypen.join(", ")
        : "Offene Verständnis- und Analysefragen";

    let materialAnweisung = "";
    if (modus === "frei") {
      if (fileData?.base64 && eigenerText?.trim()) {
        materialAnweisung = `NUTZE SOWOHL DIE ANGEHÄNGTE DATEI ("${fileData.name}") ALS AUCH DEN FOLGENDEN TEXT ALS GRUNDLAGE:\n"""\n${eigenerText}\n"""`;
      } else if (fileData?.base64) {
        materialAnweisung = `NUTZE DIE ANGEHÄNGTE DATEI ("${fileData.name}") ALS PRIMÄRE INHALTLICHE GRUNDLAGE. Extrahiere die zentralen Fakten/Textpassagen daraus, fasse sie im Einstiegstext schülergerecht zusammen und entwickle darauf aufbauende Aufgaben.`;
      } else if (eigenerText?.trim()) {
        materialAnweisung = `NUTZE FOLGENDEN QUELLENTEXT ALS GRUNDLAGE FÜR DAS ARBEITSBLATT:\n"""\n${eigenerText}\n"""`;
      } else {
        materialAnweisung = `Erstelle ein passendes Fallbeispiel oder einen Sachtext zum freien Thema "${zielThema}".`;
      }
    } else {
      materialAnweisung = `Orientiere dich strikt an den Kompetenzerwartungen des Lehrplans "${lehrplanName}" (${regionLabel}) für das Themenfeld "${zielThema}" in Klassenstufe ${klassenstufe}.`;
    }

    const promptText = `
Du bist ein erfahrener Fachlehrer und Didaktik-Experte.
Erstelle ein sofort einsetzbares, druckfertiges ${isExam ? "Klassenarbeits- / Testblatt" : "Arbeitsblatt"} als JSON.

RAHMENBEDINGUNGEN:
- Region / Bundesland: ${regionLabel} (${lehrplanName})
- Fach: ${fach}
- Schulform: ${schulform}
- Exakte Klassenstufe: Klasse ${klassenstufe}
- Thema: ${zielThema}
- Differenzierungsstufe: ${niveau}
- Zeitrahmen / Umfang: ${dauer}
- Format: ${isExam ? "Leistungskontrolle / Klassenarbeit (mit klaren Bewertungseinheiten/Punkten pro Aufgabe und detailliertem Punkte-Erwartungshorizont)" : "Übungs- und Erarbeitungsblatt"}
- Gewünschte Aufgabentypen: ${gewuenschteTypen}
${zusatzwuensche ? `- Besondere Vorgaben der Lehrkraft: ${zusatzwuensche}` : ""}

MATERIALBASIS:
${materialAnweisung}

QUALITÄTSREGELN:
1. Verwende offizielle Operatoren (z. B. Nenne, Beschreibe, Erkläre, Vergleiche, Analysiere, Beurteile) und setze sie in doppelte Sternchen (**Operator**).
2. Decke die Anforderungsbereiche AFB I (Reproduktion), AFB II (Reorganisation/Transfer) und AFB III (Reflexion/Urteil) sinnvoll ab.
3. Vergib für jede Aufgabe eine sinnvolle Punktzahl (z. B. 4–12 Punkte je nach AFB und Umfang), sodass die Gesamtsumme eine runde Zahl ergibt (z. B. 20, 25, 30 oder 40 Punkte).
4. Passe Textlänge, Wortschatz und Komplexität exakt auf Klasse ${klassenstufe} und "${niveau}" an.
5. Wenn "Lückentext" gewählt wurde, baue einen klar strukturierten Lückentext mit Unterstrichen (______) und einer Wortbank direkt in die Aufgabe ein (schreiblinien: 0).
6. Wenn "Multiple-Choice" gewählt wurde, formuliere 3–4 präzise Aussagen zum Ankreuzen (☐) direkt in die Aufgabe (schreiblinien: 0).
`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (fileData?.base64 && fileData?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.base64,
        },
      });
    }
    parts.push({ text: promptText });

    const models = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
    let lastError: unknown = null;

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts }],
          config: {
            responseMimeType: "application/json",
            responseSchema: worksheetSchema,
            temperature: 0.4,
            
          },
        });

        if (response.text) {
          return NextResponse.json(JSON.parse(response.text));
        }
      } catch (err) {
        lastError = err;
        console.warn(`Modell ${modelName} fehlgeschlagen, wechsle...`, err);
      }
    }

    throw lastError || new Error("Keine Antwort von Gemini erhalten.");
  } catch (error) {
    console.error("Fehler bei Gemini-Generierung:", error);
    let available = "";
    try {
      const pager = await new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || "").trim() }).models.list();
      const names = [];
      for await (const m of pager) {
        if (m.name && m.name.includes("gemini")) names.push(m.name.replace("models/", ""));
      }
      if (names.length) available = " | Verfügbare Modelle für deinen Key: " + names.slice(0, 8).join(", ");
    } catch {}
    const message =
      error instanceof Error
        ? `API-Fehler: ${error.message}${available}`
        : "Unbekannter Fehler bei der Gemini-Generierung.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
