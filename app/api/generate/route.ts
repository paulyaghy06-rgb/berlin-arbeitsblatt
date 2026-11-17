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
    schaubildSvg: {
      type: Type.STRING,
      description: "Nur befüllen, wenn materialTyp === schaubild gewählt wurde: valides, sauberes Inline-SVG (viewBox=0 0 600 220, schlichte Vektorformen, Pfeile, Beschriftungsboxen oder Zeichenrahmen in #1E293B und #3B38F2 auf weißem Hintergrund, ohne externe Bilder/Scripts).",
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
          punkte: { type: Type.INTEGER, description: "Erreichbare Punktzahl (z. B. 1, 2, 4, 6)" },
          text: {
            type: Type.STRING,
            description:
              "Klar und schülergerecht formulierte Aufgabenstellung mit fettgedrucktem Operator (**Wähle**, **Kreuze an**, **Berechne**, **Nenne**, **Erkläre**). Bei Multiple-Choice: Frage gefolgt von 3–4 Antwortoptionen jeweils in einer neuen Zeile mit Checkbox (□ ...).",
          },
          schreiblinien: {
            type: Type.INTEGER,
            description: "Anzahl der Zeilen/Kästchenreihen für die Schülerantwort (ZWINGEND 0 bei Multiple-Choice und Lückentext, sonst 2-6)",
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
          loesung: { type: Type.STRING, description: "Knapper, präziser Erwartungshorizont inkl. richtiger Ankreuz-Optionen / Ergebnisse" },
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
      anzahlAufgaben = 5,
      afbStufen,
      dauer,
      isExam,
      zusatzwuensche,
    } = body;

    const targetCount = Math.min(50, Math.max(1, Number(anzahlAufgaben) || 5));

    const selectedAfb: string[] =
      Array.isArray(afbStufen) && afbStufen.length > 0
        ? afbStufen
        : ["AFB I", "AFB II", "AFB III"];

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
      ? "ZWINGENDE VORGABE (HÖCHSTE PRIORITÄT – KEINE AUSNAHMEN): Der Nutzer hat AUSSCHLIESSLICH Multiple-Choice-Check ausgewählt! JEDE EINZELNE der " + targetCount + " Aufgaben im Array aufgaben MUSS eine reine Multiple-Choice-Ankreuzaufgabe sein (Fragestellung gefolgt von 3–4 Antwortoptionen jeweils in einer eigenen Zeile beginnend mit □). Es sind NULL offene Schreib-, Rechen-, Erklär-, Analyse- oder Erörterungsfragen erlaubt! Setze bei ALLEN Aufgaben zwingend schreiblinien: 0."
      : isOnlyCloze
      ? "ZWINGENDE VORGABE (HÖCHSTE PRIORITÄT – KEINE AUSNAHMEN): Der Nutzer hat AUSSCHLIESSLICH Lückentext mit Wortbank ausgewählt! JEDE EINZELNE der " + targetCount + " Aufgaben im Array aufgaben MUSS ein Lückentext mit Unterstrichen (______) und Wortbank sein! Es sind NULL offene Schreib- oder Multiple-Choice-Fragen erlaubt! Setze bei ALLEN Aufgaben zwingend schreiblinien: 0."
      : "ZWINGENDE VORGABE: Erstelle exakt " + targetCount + " Aufgaben und verwende AUSSCHLIESSLICH folgende Aufgabentypen: " + rawSelectedTypes.join(", ") + ". Mische KEINE anderen Typen darunter! Setze schreiblinien: 0 bei Multiple-Choice und Lückentext.";

    const afbInstruction =
      "ANFORDERUNGSBEREICHE (STRIKT): Verwende AUSSCHLIESSLICH die von der Lehrkraft gewählten Anforderungsbereiche: " +
      selectedAfb.join(", ") +
      ". Vergib keine Aufgaben aus nicht gewählten AFB-Stufen!";

    const clarityInstruction =
      "VERSTÄNDLICHKEITS- & STILREGEL (SEHR WICHTIG): Formuliere alle Aufgabenstellungen kurz, klar, direkt und altersgerecht für " +
      klassenstufe +
      " (" +
      schulform +
      "). Vermeide verschachtelte Schachtelsätze, unnötiges akademisches Lehrer-Deutsch und überladene Doppel-Arbeitsaufträge. Maximal 1–2 kurze Sätze pro Aufgabenstellung!";

    const compactHint =
      targetCount >= 15
        ? "KOMPAKT-MODUS WEGEN HOHER AUFGABENANZAHL (" +
          targetCount +
          " Aufgaben): Halte jede einzelne Aufgabe sowie die jeweilige Musterlösung prägnant und kurz (1–2 Zeilen pro Aufgabe), damit alle " +
          targetCount +
          " Aufgaben vollständig generiert werden."
        : "";

    const ai = new GoogleGenAI({ apiKey });
    const zielThema =
      (modus === "frei" && freiesThema ? freiesThema : thema) || ("Kernthema " + fach + " (" + klassenstufe + ")");

    let formatInstruction = "";
    if (materialFormat === "none") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = none und einstiegstext = leerer String. Erstelle KEINEN einleitenden Fließtext! Starte direkt mit den Aufgaben.";
    } else if (materialFormat === "infobox") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = infobox. Schreibe KEINEN langen Fließtext, sondern eine kompakte Merksatz- & Regelbox (max. 4-6 kurze Bulletpoints / Formeln mit Zeilenumbrüchen).";
    } else if (materialFormat === "schaubild") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = schaubild. Erstelle im Feld schaubildSvg eine klare, übersichtliche Vektor-Skizze bzw. ein Diagramm/Schaubild als valides SVG (<svg viewBox=\"0 0 600 220\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>) mit gut lesbaren Labels oder leeren Beschriftungskästchen zum Ausfüllen durch die Schüler. In einstiegstext steht ein kurzer 1-Satz-Arbeitsauftrag zum Schaubild.";
    } else if (materialFormat === "tabelle") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = tabelle und befülle das Objekt tabelle (3-4 Spalten, 4-6 Zeilen). Im Feld einstiegstext steht nur ein 1-Satz-Arbeitsauftrag.";
    } else {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = text und verfasse einen altersgerechten, gut verständlichen Informationstext bzw. Quellentext (ca. 130-210 Wörter).";
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
      "Erstelle ein druckfertiges " + (isExam ? "Klassenarbeits- / Testblatt" : "Arbeitsblatt") + " mit EXAKT " + targetCount + " Aufgaben als JSON.",
      "",
      strictTypeInstruction,
      afbInstruction,
      clarityInstruction,
      compactHint,
      "",
      "SPRACHREGEL: Schreibe Aufgabenstellungen UND Antwortoptionen konsequent in derselben Sprache (in Fremdsprachenfächern komplett in der Zielsprache – niemals Deutsch und Englisch mischen).",
      "",
      "RAHMENBEDINGUNGEN:",
      "- Bundesland: " + regionLabel + " (" + lehrplanName + ")",
      "- Fach: " + fach + " | Schulform: " + schulform + " | Klasse: " + klassenstufe,
      "- Thema: " + zielThema + " | Niveau: " + niveau,
      "- Exakte Anzahl Aufgaben: " + targetCount + (dauer ? " (Richtwert: " + dauer + ")" : ""),
      "- Erlaubte AFB-Stufen: " + selectedAfb.join(", "),
      "- Ausschließlich erlaubte Aufgabentypen: " + rawSelectedTypes.join(", "),
      zusatzwuensche ? "- Besondere Vorgaben: " + zusatzwuensche : "",
      "",
      formatInstruction,
      materialAnweisung,
      "",
      "QUALITÄTSREGELN:",
      "1. Generiere im Array aufgaben exakt " + targetCount + " fortlaufend nummerierte Aufgaben (1 bis " + targetCount + ") und im Array musterloesung exakt " + targetCount + " passende Lösungen.",
      "2. Setze Operatoren in doppelte Sternchen (**Operator**).",
      "3. Halte dich zu 100 % an die erlaubten Aufgabentypen (" + rawSelectedTypes.join(", ") + ") und AFB-Stufen (" + selectedAfb.join(", ") + ").",
      "4. Vergib sinnvolle Punktzahlen pro Aufgabe.",
    ].filter(Boolean).join("\n");

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
            systemInstruction: strictTypeInstruction + "\n" + afbInstruction + "\n" + clarityInstruction,
            responseMimeType: "application/json",
            responseSchema: worksheetSchema,
            temperature: 0.35,
            maxOutputTokens: 8192,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed.aufgaben)) {
            parsed.aufgaben = parsed.aufgaben.map((a: Record<string, unknown>, idx: number) => {
              const typLower = String(a.typ || "").toLowerCase();
              const isNoLines = isOnlyMC || isOnlyCloze || typLower.includes("multiple") || typLower.includes("lückentext");
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
