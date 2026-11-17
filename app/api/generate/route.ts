import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING, description: "Prägnanter Titel des Arbeitsblatts" },
    untertitel: { type: Type.STRING, description: "Fach, Thema und Klassenstufe" },
    materialTyp: {
      type: Type.STRING,
      description: "Art des Einstiegsmaterials: none, text, infobox oder tabelle",
    },
    einstiegstext: {
      type: Type.STRING,
      description:
        "Bei text: Sachtext/Fallbeispiel. Bei infobox: kompakter Merksatz, Formeln oder Regeln in Stichpunkten (mit Zeilenumbrüchen). Bei none: leerer String.",
    },
    tabelle: {
      type: Type.OBJECT,
      description: "Nur befüllen, wenn materialTyp === tabelle gewählt wurde.",
      properties: {
        spalten: { type: Type.ARRAY, items: { type: Type.STRING } },
        zeilen: {
          type: Type.ARRAY,
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    wortliste: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Bei Basisniveau/DaZ oder auf Wunsch: 4-6 Fachbegriffe kurz erklärt",
    },
    aufgaben: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          anforderungsbereich: { type: Type.STRING, description: "AFB I, AFB II oder AFB III" },
          typ: { type: Type.STRING, description: "Aufgabentyp exakt passend zur Auswahl der Lehrkraft" },
          punkte: { type: Type.INTEGER, description: "Erreichbare Punktzahl (z. B. 4, 6, 8, 10)" },
          text: {
            type: Type.STRING,
            description:
              "Aufgabenstellung mit fettgedrucktem Operator (**Wähle**, **Kreuze an**, **Berechne**, **Nenne**, **Erkläre**). Bei Multiple-Choice: Frage gefolgt von 3–4 Antwortoptionen jeweils in einer neuen Zeile mit Checkbox (□ ...).",
          },
          schreiblinien: {
            type: Type.INTEGER,
            description: "Anzahl der Zeilen/Kästchenreihen für die Schülerantwort (ZWINGEND 0 bei Multiple-Choice und Lückentext, sonst 3-8)",
          },
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
          loesung: { type: Type.STRING, description: "Konkreter Erwartungshorizont inkl. richtiger Ankreuz-Optionen / Rechenwegen / Ergebnissen" },
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
      materialFormat = "text",
      aufgabentypen,
      dauer,
      isExam,
      zusatzwuensche,
    } = body;

    const rawSelectedTypes: string[] =
      Array.isArray(aufgabentypen) && aufgabentypen.length > 0
        ? aufgabentypen
        : ["Offene Verständnis- & Analysefragen"];

    const isOnlyMC =
      rawSelectedTypes.length === 1 &&
      rawSelectedTypes[0].toLowerCase().includes("multiple-choice");
    const isOnlyCloze =
      rawSelectedTypes.length === 1 &&
      rawSelectedTypes[0].toLowerCase().includes("lückentext");

    const strictTypeInstruction = isOnlyMC
      ? "ZWINGENDE VORGABE (HÖCHSTE PRIORITÄT – KEINE AUSNAHMEN): Der Nutzer hat AUSSCHLIESSLICH Multiple-Choice-Check ausgewählt! JEDE EINZELNE Aufgabe im Array aufgaben (Aufgabe 1, 2, 3, 4, 5...) MUSS eine reine Multiple-Choice-Ankreuzaufgabe sein (Fragestellung gefolgt von 3–4 Antwortoptionen jeweils in einer eigenen Zeile beginnend mit □). Es sind NULL offene Schreib-, Rechen-, Erklär-, Analyse- oder Erörterungsfragen erlaubt! Setze bei ALLEN Aufgaben zwingend schreiblinien: 0."
      : isOnlyCloze
      ? "ZWINGENDE VORGABE (HÖCHSTE PRIORITÄT – KEINE AUSNAHMEN): Der Nutzer hat AUSSCHLIESSLICH Lückentext mit Wortbank ausgewählt! JEDE EINZELNE Aufgabe im Array aufgaben MUSS ein Lückentext mit Unterstrichen (______) und Wortbank sein! Es sind NULL offene Schreib- oder Multiple-Choice-Fragen erlaubt! Setze bei ALLEN Aufgaben zwingend schreiblinien: 0."
      : "ZWINGENDE VORGABE: Verwende AUSSCHLIESSLICH folgende Aufgabentypen: " + rawSelectedTypes.join(", ") + ". Mische KEINE anderen Typen darunter! Setze schreiblinien: 0 bei Multiple-Choice und Lückentext.";

    const ai = new GoogleGenAI({ apiKey });
    const zielThema =
      (modus === "frei" && freiesThema ? freiesThema : thema) || ("Kernthema " + fach + " (" + klassenstufe + ")");

    let formatInstruction = "";
    if (materialFormat === "none") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = none und einstiegstext = leerer String. Erstelle KEINEN einleitenden Fließtext! Starte direkt mit den Aufgaben.";
    } else if (materialFormat === "infobox") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = infobox. Schreibe KEINEN langen Fließtext, sondern eine kompakte Merksatz- & Regelbox (max. 4-6 kurze Bulletpoints / Formeln mit Zeilenumbrüchen).";
    } else if (materialFormat === "tabelle") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = tabelle und befülle das Objekt tabelle (3-4 Spalten, 4-6 Zeilen). Im Feld einstiegstext steht nur ein 1-Satz-Arbeitsauftrag.";
    } else {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = text und verfasse einen altersgerechten Informationstext bzw. Quellentext (ca. 140-230 Wörter).";
    }

    let materialAnweisung = "";
    if (modus === "frei") {
      if (fileData?.base64 && eigenerText?.trim()) {
        materialAnweisung = "NUTZE DIE ANGEHÄNGTE DATEI (" + fileData.name + ") UND DEN QUELLENTEXT:\n" + eigenerText;
      } else if (fileData?.base64) {
        materialAnweisung = "NUTZE DIE ANGEHÄNGTE DATEI (" + fileData.name + ") ALS PRIMÄRE GRUNDLAGE.";
      } else if (eigenerText?.trim()) {
        materialAnweisung = "NUTZE FOLGENDEN QUELLENTEXT ALS GRUNDLAGE:\n" + eigenerText;
      } else {
        materialAnweisung = "Erstelle fachlich präzise Inhalte zum Thema " + zielThema + ".";
      }
    } else {
      materialAnweisung = "Orientiere dich am Lehrplan " + lehrplanName + " (" + regionLabel + ") für " + zielThema + " in " + klassenstufe + ".";
    }

    const promptText = [
      "Du bist ein erfahrener Fachlehrer und Didaktik-Experte.",
      "Erstelle ein druckfertiges " + (isExam ? "Klassenarbeits- / Testblatt" : "Arbeitsblatt") + " als JSON.",
      "",
      strictTypeInstruction,
      "",
      "SPRACHREGEL: Schreibe Aufgabenstellungen UND Antwortoptionen konsequent in derselben Sprache (in Fremdsprachenfächern komplett in der Zielsprache – niemals Deutsch und Englisch mischen).",
      "",
      "RAHMENBEDINGUNGEN:",
      "- Bundesland: " + regionLabel + " (" + lehrplanName + ")",
      "- Fach: " + fach + " | Schulform: " + schulform + " | Klasse: " + klassenstufe,
      "- Thema: " + zielThema + " | Niveau: " + niveau + " | Dauer: " + dauer,
      "- Ausschließlich erlaubte Aufgabentypen: " + rawSelectedTypes.join(", "),
      zusatzwuensche ? "- Besondere Vorgaben: " + zusatzwuensche : "",
      "",
      formatInstruction,
      materialAnweisung,
      "",
      "QUALITÄTSREGELN:",
      "1. Setze Operatoren in doppelte Sternchen (**Operator**).",
      "2. Halte dich zu 100 % an die erlaubten Aufgabentypen (" + rawSelectedTypes.join(", ") + ").",
      "3. Vergib sinnvolle Punktzahlen pro Aufgabe.",
    ].join("\n");

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (fileData?.base64 && fileData?.mimeType) {
      parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } });
    }
    parts.push({ text: promptText });

    const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    let lastError: unknown = null;

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: strictTypeInstruction,
            responseMimeType: "application/json",
            responseSchema: worksheetSchema,
            temperature: 0.35,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed.aufgaben)) {
            parsed.aufgaben = parsed.aufgaben.map((a: Record<string, unknown>) => {
              const typLower = String(a.typ || "").toLowerCase();
              const isNoLines = isOnlyMC || isOnlyCloze || typLower.includes("multiple") || typLower.includes("lückentext");
              return isNoLines ? { ...a, schreiblinien: 0 } : a;
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
