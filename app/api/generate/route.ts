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
      description: "Art des Einstiegsmaterials: 'none', 'text', 'infobox' oder 'tabelle'",
    },
    einstiegstext: {
      type: Type.STRING,
      description:
        "Bei 'text': Sachtext/Fallbeispiel. Bei 'infobox': kompakter Merksatz, Formeln oder Regeln in Stichpunkten (mit Zeilenumbrüchen). Bei 'none': leerer String ''.",
    },
    tabelle: {
      type: Type.OBJECT,
      description: "Nur befüllen, wenn materialTyp === 'tabelle' gewählt wurde.",
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
          typ: { type: Type.STRING, description: "Aufgabentyp wie Rechenaufgaben, Lückentext, Analyse, Tabelle" },
          punkte: { type: Type.INTEGER, description: "Erreichbare Punktzahl (z. B. 4, 6, 8, 10)" },
          text: {
            type: Type.STRING,
            description:
              "Aufgabenstellung mit fettgedrucktem Operator (**Berechne**, **Nenne**, **Erkläre**). Bei Mathe/Übungsaufgaben klare Teilaufgaben (a, b, c, d) mit Zeilenumbrüchen (\\n) strukturieren – KEIN unnötiger Fließtext!",
          },
          schreiblinien: {
            type: Type.INTEGER,
            description: "Anzahl der Zeilen/Kästchenreihen für die Schülerantwort (0 bei Multiple-Choice/Lückentext, sonst 3-8)",
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
          loesung: { type: Type.STRING, description: "Konkreter Erwartungshorizont inkl. Rechenwegen/Ergebnissen" },
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

    const rawSelectedTypes = Array.isArray(body.aufgabentypen) && body.aufgabentypen.length > 0
      ? body.aufgabentypen
      : ["Offene Verständnis- & Analysefragen"];
    const isOnlyMC = rawSelectedTypes.length === 1 && rawSelectedTypes[0].toLowerCase().includes("multiple-choice");
    const isOnlyCloze = rawSelectedTypes.length === 1 && rawSelectedTypes[0].toLowerCase().includes("lückentext");

    const strictTypeInstruction = isOnlyMC
      ? "\n\nABSOLUTE PFLICHTREGEL (KEINE AUSNAHMEN): Der Nutzer hat AUSSCHLIESSLICH 'Multiple-Choice-Check' ausgewählt! JEDE EINZELNE Aufgabe im JSON-Array 'aufgaben' (Aufgabe 1, 2, 3, 4, 5...) MUSS eine reine Multiple-Choice-Ankreuzaufgabe sein (Fragestellung gefolgt von Antwortoptionen mit Checkboxen wie '□ A) ...', '□ B) ...', '□ C) ...', '□ D) ...' jeweils in einer eigenen Zeile). Es sind NULL offene Schreib-, Erklär-, Analyse- oder Erörterungsfragen erlaubt! Setze bei ALLEN Aufgaben 'zeilen': 0."
      : isOnlyCloze
      ? "\n\nABSOLUTE PFLICHTREGEL (KEINE AUSNAHMEN): Der Nutzer hat AUSSCHLIESSLICH 'Lückentext mit Wortbank' ausgewählt! JEDE EINZELNE Aufgabe im JSON-Array 'aufgaben' MUSS ein Lückentext mit Lücken ('______') sein. Es sind NULL offene Schreibfragen erlaubt! Setze bei ALLEN Aufgaben 'zeilen': 0."
      : `\n\nABSOLUTE PFLICHTREGEL: Der Nutzer hat folgende Aufgabentypen gewählt: ${rawSelectedTypes.join(", ")}. Verwende AUSSCHLIESSLICH diese gewählten Aufgabentypen und mische KEINE nicht ausgewählten Typen darunter.`;

    const languageConsistencyRule = "\n\nSPRACHREGEL: Schreibe Aufgabenstellungen UND Antwortoptionen konsequent in derselben Sprache (in Fremdsprachenfächern wie Englisch, Französisch oder Spanisch komplett in der Zielsprache – niemals deutsche Fragestellung mit englischen Antwortoptionen mischen!).";

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

    const ai = new GoogleGenAI({ apiKey });

    const zielThema =
      (modus === "frei" && freiesThema ? freiesThema : thema) || `Kernthema ${fach} (${klassenstufe})`;
    const gewuenschteTypen =
      aufgabentypen && aufgabentypen.length > 0
        ? aufgabentypen.join(", ")
        : "Abwechslungsreiche fachspezifische Aufgaben";

    let formatInstruction = "";
    if (materialFormat === "none") {
      formatInstruction = `WICHTIG ZUM EINSTIEG: Setze materialTyp = "none" und einstiegstext = "". Erstelle KEINEN einleitenden Fließtext! Starte direkt mit klar gegliederten, sofort bearbeitbaren Aufgaben (z. B. Teilaufgaben a), b), c) mit Zeilenumbrüchen).`;
    } else if (materialFormat === "infobox") {
      formatInstruction = `WICHTIG ZUM EINSTIEG: Setze materialTyp = "infobox". Schreibe KEINEN langen Fließtext, sondern eine kompakte Merksatz- & Regelbox (max. 4-6 kurze Bulletpoints / Formeln / Beispielrechnungen mit Zeilenumbrüchen \\n).`;
    } else if (materialFormat === "tabelle") {
      formatInstruction = `WICHTIG ZUM EINSTIEG: Setze materialTyp = "tabelle" und befülle das Objekt "tabelle" (3-4 Spalten, 4-6 Zeilen mit relevanten Daten/Messwerten/Fakten zum Thema). Im Feld einstiegstext steht nur ein 1-Satz-Arbeitsauftrag zur Tabelle.`;
    } else {
      formatInstruction = `WICHTIG ZUM EINSTIEG: Setze materialTyp = "text" und verfasse einen altersgerechten, sprachsensiblen Informationstext bzw. Quellentext (ca. 140-230 Wörter).`;
    }

    let materialAnweisung = "";
    if (modus === "frei") {
      if (fileData?.base64 && eigenerText?.trim()) {
        materialAnweisung = `NUTZE SOWOHL DIE ANGEHÄNGTE DATEI ("${fileData.name}") ALS AUCH DEN FOLGENDEN TEXT ALS GRUNDLAGE:\n"""\n${eigenerText}\n"""`;
      } else if (fileData?.base64) {
        materialAnweisung = `NUTZE DIE ANGEHÄNGTE DATEI ("${fileData.name}") ALS PRIMÄRE INHALTLICHE GRUNDLAGE.`;
      } else if (eigenerText?.trim()) {
        materialAnweisung = `NUTZE FOLGENDEN QUELLENTEXT ALS GRUNDLAGE:\n"""\n${eigenerText}\n"""`;
      } else {
        materialAnweisung = `Erstelle fachlich präzise Inhalte zum freien Thema "${zielThema}".`;
      }
    } else {
      materialAnweisung = `Orientiere dich an den Kompetenzerwartungen des Lehrplans "${lehrplanName}" (${regionLabel}) für "${zielThema}" in ${klassenstufe}.`;
    }

    const promptText = `
Du bist ein erfahrener Fachlehrer und Didaktik-Experte.
Erstelle ein sofort einsetzbares, druckfertiges ${isExam ? "Klassenarbeits- / Testblatt" : "Arbeitsblatt"} als JSON.

RAHMENBEDINGUNGEN:
- Region / Bundesland: ${regionLabel} (${lehrplanName})
- Fach: ${fach}
- Schulform: ${schulform}
- Klassenstufe: ${klassenstufe}
- Thema: ${zielThema}
- Differenzierungsstufe: ${niveau}
- Zeitrahmen / Umfang: ${dauer}
- Format: ${isExam ? "Leistungskontrolle / Klassenarbeit (mit klaren Punkten pro Aufgabe)" : "Übungs- und Erarbeitungsblatt"}
- Gewünschte Aufgabentypen: ${gewuenschteTypen}
${zusatzwuensche ? `- Besondere Vorgaben der Lehrkraft: ${zusatzwuensche}` : ""}

DARSTELLUNGSFORMAT DES MATERIALS:
${formatInstruction}

MATERIALBASIS:
${materialAnweisung}

BUNDESLAND- & FACH-REGELN:
${lehrplanName.includes("Berlin-Brandenburg") ? "- Nutze die offiziellen Berliner Operatoren (AFB I: Nenne, Beschreibe, Berechne; AFB II: Erkläre, Vergleiche, Analysiere; AFB III: Beurteile, Bewerte, Begründe) und berücksichtige die Niveaustufen A–H." : "- Nutze die offiziellen KMK-Operatoren nach AFB I–III."}
${fach === "Mathematik" || fach === "Physik" || fach === "Chemie" ? "- Formuliere Aufgaben knackig und strukturiert mit Teilaufgaben a), b), c) (getrennt durch \\n) statt langer Textblöcke. Nutze saubere mathematische Schreibweise (×, ÷, ², ³, √, ½)." : ""}
${klassenstufe.match(/Klasse [1-4]\b/) ? "- GRUNDSCHUL-MODUS: Verwende kurze, klare Sätze, direkte Ansprache (Du-Form), große Übersichtlichkeit und kindgerechte Beispiele." : ""}

QUALITÄTSREGELN:
1. Setze Operatoren immer in doppelte Sternchen (**Operator**).
2. Decke AFB I, AFB II und AFB III sinnvoll ab.
3. Vergib für jede Aufgabe eine sinnvolle Punktzahl (Gesamtsumme z. B. 20, 25 oder 30 Punkte).
4. Wenn "Lückentext" gewählt wurde, baue den Lückentext mit Unterstrichen (______) und Wortbank direkt in die Aufgabe ein (schreiblinien: 0).
5. Wenn "Multiple-Choice" gewählt wurde, formuliere 3–4 Aussagen zum Ankreuzen (☐) direkt in die Aufgabe (schreiblinien: 0).
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

    const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
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
      const names: string[] = [];
      for await (const m of pager) {
        if (m.name && m.name.includes("gemini")) names.push(m.name.replace("models/", ""));
      }
      if (names.length) available = " | Verfügbare Modelle: " + names.slice(0, 6).join(", ");
    } catch {}
    const message =
      error instanceof Error
        ? `API-Fehler: ${error.message}${available}`
        : "Unbekannter Fehler bei der Gemini-Generierung.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
