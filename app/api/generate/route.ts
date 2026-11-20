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
    isPartnerarbeit: {
      type: Type.BOOLEAN,
      description: "True, wenn ein 2-seitiges Partnerarbeit-Arbeitsblatt (Blatt A und Blatt B) angefordert wurde.",
    },
    partnerModus: {
      type: Type.STRING,
      description: "Gewählte Partnerarbeit-Methode: tandem, prokontra oder quiz",
    },
    partnerB: {
      type: Type.OBJECT,
      description: "Nur befüllen, wenn partnerarbeit === true: Das komplementäre Arbeitsblatt für Partner B (Seite 2).",
      properties: {
        untertitel: { type: Type.STRING, description: "Untertitel für Partner B (z. B. Rolle / Teil B)" },
        materialTyp: { type: Type.STRING, description: "none, text, infobox oder tabelle" },
        infoboxTitel: { type: Type.STRING, description: "Titel des Merkkastens / der Rollenkarte für Partner B" },
        einstiegstext: { type: Type.STRING, description: "Komplementärer Text / Rollenkarte / Infobox für Partner B" },
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
      },
      required: ["untertitel", "materialTyp", "einstiegstext", "aufgaben"],
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
      partnerarbeit = false,
      partnerModus = "tandem",
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

    const difficultyInstruction =
      "UNABHÄNGIGKEIT VON SCHWIERIGKEIT & AFB (WICHTIG): Die gewählte Niveaustufe (" +
      niveau +
      ") bestimmt Sprachkomplexität, Vorwissen, Hilfestellungen und Denktiefe – völlig UNABHÄNGIG von den gewählten AFB-Stufen! Auch eine reine AFB-I-Aufgabe kann auf hohem Niveau anspruchsvolles Fakten-/Detailwissen abfragen, und eine AFB-III-Aufgabe auf Basisniveau mit klaren Leitfragen leicht zugänglich sein.";
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
      formatInstruction = "WICHTIG ZUM EINSTIEG (PFLICHTFELD): Setze materialTyp = \"schaubild\". Du MUSST das Feld \"schaubildSvg\" zwingend mit einem vollständigen, validen Inline-SVG (<svg viewBox=\"0 0 600 240\" width=\"600\" height=\"240\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>) befüllen! Zeichne darin ein thematisch passendes Schaubild, eine beschriftete Skizze, ein Kreislauf-/Ablaufdiagramm oder eine schematische Karikatur/Illustration mit klaren Vektorformen (<rect>, <circle>, <line>, <path>, <polygon>, <text>) in #1E293B, #3B38F2 und #F8FAFC. Lasse das Feld schaubildSvg NIEMALS leer! Im Feld einstiegstext steht ein kurzer 1-Satz-Arbeitsauftrag zum Schaubild.";
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


    let partnerInstruction = "";
    if (partnerarbeit) {
      const modeDesc =
        partnerModus === "prokontra"
          ? "PRO & KONTRA DISKUSSION / ROLLENSPIEL: Blatt A vertritt Position/Rolle A (mit stichhaltigen Pro-Argumenten, Rollenkarte im Einstiegsmaterial, Leitfragen zur Vorbereitung der Argumentation und einer Aufgabe zur gemeinsamen Kompromissfindung). Blatt B vertritt die Gegenposition/Rolle B (mit Kontra-Argumenten, Rollenkarte B im Feld partnerB.einstiegstext und passenden Gegenfragen)."
          : partnerModus === "quiz"
          ? "GEGENSEITIGES QUIZ (ABFRAGE-TANDEM): Blatt A enthält im Einstiegsmaterial/Aufgabenbereich Quizfragen samt kompakten Kontroll-Lösungen, mit denen Partner A Partner B abfragt, sowie Aufgaben/Antwortfelder für die Fragen, die Partner B stellt. Blatt B (partnerB) enthält komplementäre Quizfragen + Kontroll-Lösungen zum Abfragen von Partner A."
          : "TANDEM / INFORMATIONSLÜCKE (INFO-GAP): Blatt A erhält Informationsteil 1 (im Einstiegsmaterial von Blatt A) und Aufgaben/Lücken, die NUR mit den Informationen von Partner B gelöst werden können. Blatt B (partnerB) erhält Informationsteil 2 (in partnerB.einstiegstext) und Aufgaben/Lücken, die NUR mit den Informationen von Partner A gelöst werden können. Beide Blätter ergänzen sich zu 100 %!";

      partnerInstruction = [
        "MODUS PARTNERARBEIT (BLATT A & BLATT B – HÖCHSTE PRIORITÄT):",
        "Erstelle ein didaktisch verzahntes 2-Seiten-Partnerarbeit-Set! Das Hauptobjekt (titel, untertitel, einstiegstext, aufgaben) ist BLATT A (für Partner A). Das Feld partnerB ist BLATT B (für Partner B).",
        modeDesc,
        "WICHTIG FÜR PARTNERARBEIT:",
        "- Setze isPartnerarbeit = true und partnerModus = '" + partnerModus + "'.",
        "- Generiere auf Blatt A ca. " + Math.max(2, Math.min(5, targetCount)) + " Aufgaben und auf Blatt B (partnerB.aufgaben) ebenfalls ca. " + Math.max(2, Math.min(5, targetCount)) + " komplementäre Aufgaben (jeweils nummeriert ab 1).",
        "- Achte darauf, dass Blatt A und Blatt B NICHT identisch sind, sondern echte Kommunikation und Austausch zwischen Partner A und Partner B erzwingen!",
        "- In musterloesung führe die Lösungen für Blatt A und Blatt B übersichtlich auf (kennzeichne im Text 'loesung' klar mit '[Blatt A]' und '[Blatt B]').",
      ].join("\n");
    }

    const promptText = [
      "Du bist ein erfahrener Fachlehrer und Didaktik-Experte.",
      "Erstelle ein druckfertiges " + (isExam ? "Klassenarbeits- / Testblatt" : "Arbeitsblatt") + " mit EXAKT " + targetCount + " Aufgaben als JSON.",
      "",
      partnerInstruction,
      strictTypeInstruction,
      difficultyInstruction,
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
          
          if (materialFormat === "schaubild") {
            parsed.materialTyp = "schaubild";
            if (!parsed.schaubildSvg || !String(parsed.schaubildSvg).includes("<svg")) {
              const safeTitle = String(zielThema || fach || "Schaubild").replace(/[<>&"]/g, "");
              parsed.schaubildSvg = `<svg viewBox="0 0 600 220" width="600" height="220" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="580" height="200" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/><text x="300" y="38" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1E293B">${safeTitle}</text><rect x="40" y="65" width="145" height="65" rx="10" fill="#EEF2FF" stroke="#3B38F2" stroke-width="2"/><text x="112" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#1E293B">1. Ausgangspunkt</text><line x1="185" y1="97" x2="225" y2="97" stroke="#3B38F2" stroke-width="2.5"/><polygon points="225,92 235,97 225,102" fill="#3B38F2"/><rect x="235" y="65" width="145" height="65" rx="10" fill="#FFFFFF" stroke="#64748B" stroke-width="2" stroke-dasharray="5,4"/><text x="307" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748B">2. Prozess / Kern</text><line x1="380" y1="97" x2="415" y2="97" stroke="#3B38F2" stroke-width="2.5"/><polygon points="415,92 425,97 415,102" fill="#3B38F2"/><rect x="425" y="65" width="140" height="65" rx="10" fill="#EEF2FF" stroke="#3B38F2" stroke-width="2"/><text x="495" y="102" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#1E293B">3. Ergebnis</text><rect x="40" y="150" width="525" height="40" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/><text x="55" y="175" font-family="sans-serif" font-size="11" fill="#64748B">Eigene Beschriftung / Notizen zum Schaubild:</text></svg>`;
            }
          }

          if (partnerarbeit) {
            parsed.isPartnerarbeit = true;
            parsed.partnerModus = partnerModus;
          }
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
