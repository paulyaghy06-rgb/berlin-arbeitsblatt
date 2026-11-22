import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const taskItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nummer: { type: Type.INTEGER },
    anforderungsbereich: { type: Type.STRING, description: "AFB I, AFB II oder AFB III" },
    typ: { type: Type.STRING, description: "Aufgabentyp" },
    punkte: { type: Type.INTEGER, description: "Erreichbare Punktzahl" },
    text: {
      type: Type.STRING,
      description:
        "Klar und schülergerecht formulierte Aufgabenstellung mit fettgedrucktem Operator (**Befrage**, **Ergänze**, **Überzeuge**, **Frage ab**, **Notiere**).",
    },
    schreiblinien: {
      type: Type.INTEGER,
      description: "Anzahl der Schreiblinien für die Schülerantwort (0 bei Multiple-Choice/Lückentext, sonst 2-6)",
    },
  },
  required: ["nummer", "anforderungsbereich", "typ", "punkte", "text", "schreiblinien"],
};

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
      description:
        "Nur befüllen, wenn materialTyp === schaubild gewählt wurde: valides, sauberes Inline-SVG (viewBox=0 0 600 220).",
    },
    einstiegstext: {
      type: Type.STRING,
      description:
        "Bei text: Sachtext/Fallbeispiel. Bei infobox: kompakter Merksatz/Regelbox. Bei none: leerer String.",
    },
    tabelle: {
      type: Type.OBJECT,
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
      description: "4-6 Fachbegriffe kurz erklärt",
    },
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
    titel: { type: Type.STRING, description: "Gemeinsamer Titel des Partnerarbeit-Themas" },
    untertitel: { type: Type.STRING, description: "z. B. Partner A · Teil 1 / Rolle Pro / Quiz-Set A" },
    ablaufHinweis: {
      type: Type.STRING,
      description:
        "Kurze, konkrete Schritt-für-Schritt-Spielregel für beide Schüler (2-3 Sätze, z. B. Blatt verdecken, erst allein lesen, dann gegenseitig befragen).",
    },
    isPartnerarbeit: { type: Type.BOOLEAN },
    partnerModus: { type: Type.STRING },
    materialTyp: {
      type: Type.STRING,
      description: "Für Partner A: 'text', 'infobox' oder 'tabelle' (NIEMALS 'none' bei Partnerarbeit!)",
    },
    infoboxTitel: {
      type: Type.STRING,
      description: "Überschrift des Materials für Partner A (z. B. 'Geheimes Infoblatt A', 'Rollenkarte A: Pro', 'Deine Quizfragen für Partner B')",
    },
    einstiegstext: {
      type: Type.STRING,
      description:
        "Exklusives Material für Partner A (nur Infos zu Teil A / Pro-Argumente / Quizfragen inkl. Kontroll-Lösungen zum Abfragen von B).",
    },
    tabelle: {
      type: Type.OBJECT,
      properties: {
        spalten: { type: Type.ARRAY, items: { type: Type.STRING } },
        zeilen: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
      },
    },
    wortliste: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    aufgaben: {
      type: Type.ARRAY,
      description: "Aufgaben für Partner A (3-5 Aufgaben, die den Austausch mit Partner B erfordern)",
      items: taskItemSchema,
    },
    partnerB: {
      type: Type.OBJECT,
      description: "ZWINGENDES komplementäres Arbeitsblatt für Partner B (Seite 2).",
      properties: {
        untertitel: { type: Type.STRING, description: "z. B. Partner B · Teil 2 / Rolle Kontra / Quiz-Set B" },
        materialTyp: { type: Type.STRING, description: "'text', 'infobox' oder 'tabelle'" },
        infoboxTitel: {
          type: Type.STRING,
          description: "Überschrift des Materials für Partner B (z. B. 'Geheimes Infoblatt B', 'Rollenkarte B: Kontra', 'Deine Quizfragen für Partner A')",
        },
        einstiegstext: {
          type: Type.STRING,
          description:
            "Exklusives Material für Partner B – inhaltlich KOMPLEMENTÄR zu Partner A (andere Fakten / Kontra-Rolle / anderes Quiz-Set mit Kontroll-Lösungen).",
        },
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
          description: "Aufgaben für Partner B (3-5 komplementäre Aufgaben)",
          items: taskItemSchema,
        },
      },
      required: ["untertitel", "materialTyp", "infoboxTitel", "einstiegstext", "aufgaben"],
    },
    musterloesung: {
      type: Type.ARRAY,
      description: "Erwartungshorizont für die Lehrkraft zu Blatt A und Blatt B",
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          loesung: { type: Type.STRING, description: "Kennzeichne klar mit [Blatt A] und [Blatt B]" },
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

    const ai = new GoogleGenAI({ apiKey });
    const zielThema =
      (modus === "frei" && freiesThema ? freiesThema : thema) || `Kernthema ${fach} (${klassenstufe})`;

    const models = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    let lastError: unknown = null;

    const isMath = String(fach || "").toLowerCase().includes("mathe");
    const isScienceCalc = ["physik", "chemie"].some((s) =>
      String(fach || "").toLowerCase().includes(s)
    );

    // ========================================================================
    // FALL A: PARTNERARBEIT (BLATT A & BLATT B)
    // ========================================================================
    if (partnerarbeit) {
      const pairTaskCount = Math.min(6, Math.max(3, Number(anzahlAufgaben) || 4));

      let methodeDetail = "";
      if (isMath && partnerModus !== "prokontra") {
        methodeDetail = `METHODE: MATHEMATIK-RECHEN-TANDEM (PARTNERKONTROLLE)
- Typisches Mathe-Tandembogen-Prinzip mit KONKRETEN RECHENAUFGABEN (keine reinen Laberfragen!):
- Blatt A (Partner A):
  - Setze materialTyp = "infobox", infoboxTitel = "Kontrolllösungen für Partner B (nicht zeigen!)".
  - einstiegstext enthält die exakten, doppelt geprüften Lösungen inkl. kurzem Rechenweg zu den Rechenaufgaben von Blatt B (nummeriert 1 bis ${pairTaskCount}, jeweils in einer eigenen Zeile).
  - aufgaben auf Blatt A (${pairTaskCount} konkrete Rechenaufgaben passend zu ${zielThema}, ${klassenstufe}):
    Jede Aufgabe ist eine echte Rechen-, Term-, Gleichungs- oder Sachaufgabe mit konkreten Zahlen (z. B. "**Berechne:** a) ... b) ..."). Setze schreiblinien: 3–4 für Rechenplatz.
- Blatt B (partnerB):
  - Setze partnerB.materialTyp = "infobox", partnerB.infoboxTitel = "Kontrolllösungen für Partner A (nicht zeigen!)".
  - partnerB.einstiegstext enthält die exakten, doppelt geprüften Lösungen inkl. kurzem Rechenweg zu den Rechenaufgaben von Blatt A (nummeriert 1 bis ${pairTaskCount}).
  - partnerB.aufgaben (${pairTaskCount} ANDERE, gleich schwere Rechenaufgaben mit anderen Zahlen zum selben Thema — NIEMALS dieselben Aufgaben kopieren!). Setze schreiblinien: 3–4.
- MATHE-NOTATION: Nutze saubere Unicode-Zeichen (·, :, −, ², ³, √, π, ≤, ≥, °, ≈, Brüche wie 3/4), NIEMALS rohen LaTeX-Code wie \\frac oder $...$!`;
      } else if (partnerModus === "prokontra") {
        methodeDetail = `METHODE: PRO & KONTRA DISKUSSION / ROLLENSPIEL
- Blatt A ist die **Rollenkarte A (Pro-Position)**:
  - Setze materialTyp = "infobox", infoboxTitel = "Rollenkarte A: Deine Position (Pro)".
  - Schreibe in einstiegstext eine konkrete Ausgangssituation/Rolle und 4 stichhaltige Pro-Argumente mit konkreten Beispielen (mit Zeilenumbrüchen).
  - Aufgaben auf Blatt A (${pairTaskCount} Aufgaben):
    1. Argumente aus deiner Rollenkarte gewichten und eigene Einstiegsrede formulieren.
    2. Fragen an Partner B (Kontra-Seite) vorbereiten, um dessen Position kritisch zu hinterfragen.
    3. Während der Debatte: Wichtigste Gegenargumente von Partner B notieren.
    4. Gemeinsam mit Partner B einen fairen Kompromiss formulieren und aufschreiben.
- Blatt B (partnerB) ist die **Rollenkarte B (Kontra-Position)**:
  - Setze partnerB.materialTyp = "infobox", partnerB.infoboxTitel = "Rollenkarte B: Deine Position (Kontra)".
  - Schreibe in partnerB.einstiegstext die Gegenrolle und 4 stichhaltige Kontra-Argumente/Risiken.
  - Aufgaben auf Blatt B (${pairTaskCount} Aufgaben): Spiegelbildliche Aufgaben (eigene Kontra-Argumente vorbereiten, kritische Fragen an Pro-Seite, Pro-Argumente von Partner A mitschreiben, gemeinsamen Kompromiss notieren).`;
      } else if (partnerModus === "quiz") {
        methodeDetail = `METHODE: GEGENSEITIGES QUIZ (ABFRAGE-TANDEM)
- Blatt A ist **Quiz-Set A (Partner A fragt Partner B ab)**:
  - Setze materialTyp = "infobox", infoboxTitel = "Deine Quizfragen für Partner B (nicht zeigen! Lösung in Klammern)".
  - Schreibe in einstiegstext 4 bis 5 abwechslungsreiche Quizfragen (Fakten-, Verständnis- und Transferfragen zum Thema) jeweils mit der richtigen Kontroll-Lösung direkt dahinter in Klammern, z. B.:
    "Frage 1: ... (Lösung: ...)" jeweils in einer eigenen Zeile (getrennt durch \n)
  - Aufgaben auf Blatt A (3-4 Aufgaben):
    1. **Bereite dich vor:** Lies deine Quizfragen still durch und überlege dir einen Tipp, falls Partner B nicht weiterweiß (schreiblinien: 0).
    2. **Frage Partner B ab:** Stelle deine Fragen nacheinander und kreuze an, wie viele Punkte B erreicht hat: Frage 1 ☐  |  Frage 2 ☐  |  Frage 3 ☐  |  Frage 4 ☐ (schreiblinien: 0).
    3. **Beantworte die Fragen von Partner B:** Notiere hier Stichpunkte zu den Fragen, die dir Partner B stellt (schreiblinien: 4).
    4. **Tauscht euch aus:** Welche Frage war am schwierigsten? Formuliert gemeinsam einen Merksatz (schreiblinien: 2).
- Blatt B (partnerB) ist **Quiz-Set B (Partner B fragt Partner A ab)**:
  - Setze partnerB.materialTyp = "infobox", partnerB.infoboxTitel = "Deine Quizfragen für Partner A (nicht zeigen! Lösung in Klammern)".
  - Schreibe in partnerB.einstiegstext 4 bis 5 ANDERE, inhaltlich neue Quizfragen zum Thema (ebenfalls jeweils mit "(Lösung: ...)" dahinter – KEINE doppelten Fragen zu Blatt A!).
  - Aufgaben auf Blatt B: Spiegelbildlich zu Blatt A (Fragen an Partner A stellen + Punkte abhaken, Antworten auf Fragen von Partner A notieren, gemeinsamen Merksatz formulieren).`;
      } else {
        methodeDetail = `METHODE: TANDEM / INFORMATIONSLÜCKE (INFO-GAP)
- Das Thema wird in TWO komplementäre Hälften (Aspekt/Fallbeispiel 1 vs. Aspekt/Fallbeispiel 2) aufgeteilt!
- Blatt A erhält **nur Informationsteil A**:
  - Setze materialTyp = "text" (oder "tabelle"), infoboxTitel = "Informationsteil A (nur für Partner A)".
  - einstiegstext erklärt ausführlich Teilbereich 1 (ca. 130-180 Wörter) – erwähnt aber NICHT die Details von Teilbereich 2!
  - Aufgaben auf Blatt A (${pairTaskCount} Aufgaben):
    - Aufgabe 1: Erschließe deinen eigenen Text A (Steckbrief / Kernaussagen für deinen Partner zusammenfassen).
    - Aufgabe 2 & 3: **Befrage Partner B** (ohne auf sein Blatt zu schauen!) nach den fehlenden Informationen aus Teilbereich 2 und trage sie hier ein (z. B. Lückentext oder Vergleichstabelle mit Lücken, die NUR mit Wissen aus Blatt B lösbar sind!).
    - Aufgabe 4: Vergleicht gemeinsam Teil A und Teil B und zieht ein Fazit.
- Blatt B (partnerB) erhält **nur Informationsteil B**:
  - Setze partnerB.materialTyp = "text", partnerB.infoboxTitel = "Informationsteil B (nur für Partner B)".
  - partnerB.einstiegstext erklärt ausführlich Teilbereich 2 (ca. 130-180 Wörter) – genau die Infos, die Partner A für seine Aufgaben 2 & 3 braucht!
  - Aufgaben auf Blatt B (${pairTaskCount} Aufgaben): Spiegelbildlich (zuerst eigenen Teil B erschließen, dann Partner A nach Teilbereich 1 befragen und Lücken ausfüllen, danach gemeinsames Fazit).`;
      }

      let partnerMaterialHint = "";
      if (modus === "frei") {
        if (fileData?.base64 && eigenerText?.trim()) {
          partnerMaterialHint = "MATERIALGRUNDLAGE: Nutze die angehängte Datei (" + fileData.name + ") UND den folgenden Quellentext als inhaltliche Basis für Blatt A und Blatt B:\n" + eigenerText;
        } else if (fileData?.base64) {
          partnerMaterialHint = "MATERIALGRUNDLAGE: Nutze die angehängte Datei (" + fileData.name + ") als primäre inhaltliche Basis und teile die Inhalte sinnvoll auf Blatt A und Blatt B auf.";
        } else if (eigenerText?.trim()) {
          partnerMaterialHint = "MATERIALGRUNDLAGE: Nutze folgenden Quellentext als inhaltliche Basis für Blatt A und Blatt B:\n" + eigenerText;
        }
      } else {
        partnerMaterialHint = "LEHRPLANBEZUG: Orientiere dich am Lehrplan " + lehrplanName + " (" + regionLabel + ") für " + zielThema + " in " + klassenstufe + ".";
      }

      const partnerPrompt = `Du bist ein erfahrener Didaktik-Experte für kooperatives Lernen.
Erstelle ein sofort einsetzbares, echtes 2-Seiten-Partnerarbeit-Set (Blatt A für Schüler A und Blatt B für Schüler B) als JSON.

RAHMENBEDINGUNGEN:
- Bundesland: ${regionLabel} (${lehrplanName})
- Fach: ${fach} | Schulform: ${schulform} | Klasse: ${klassenstufe}
- Thema: ${zielThema}
- Schwierigkeit: ${niveau}
${zusatzwuensche ? "- Besondere Vorgaben der Lehrkraft: " + zusatzwuensche : ""}

${partnerMaterialHint}

${methodeDetail}

ZWINGENDE REGELN:
1. Blatt A (Hauptfelder) und Blatt B (Objekt "partnerB") MÜSSEN unterschiedliche Materialien und komplementäre Aufgaben haben – niemals identische Texte kopieren!
2. Befülle das Feld "ablaufHinweis" mit einer klaren 2-Satz-Anweisung für die Schüler (z. B. "Deckt eure Blätter gegenseitig ab! Bearbeitet zuerst Schritt 1 allein und tauscht euch danach mündlich aus.").
3. Schreibe schülergerecht in der Du-Form für ${klassenstufe}, ohne Meta-Kommentare über Schüler im Fließtext (NICHT "Die Schülerinnen und Schüler untersuchen...", sondern direkt an den Schüler gerichtet!).
4. Setze Operatoren in doppelte Sternchen (**Operator**).`;

      for (const modelName of models) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{
              role: "user",
              parts: [
                ...(fileData?.base64 && fileData?.mimeType
                  ? [{ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } }]
                  : []),
                { text: partnerPrompt },
              ],
            }],
            config: {
              systemInstruction:
                "Du erstellst kooperative Partnerarbeit-Arbeitsblätter (Blatt A und Blatt B) mit echter Informationslücke, Rollenverteilung oder gegenseitigem Quiz. Blatt A und Blatt B müssen zwingend beide vollständig befüllt und inhaltlich komplementär sein.",
              responseMimeType: "application/json",
              responseSchema: partnerWorksheetSchema,
              temperature: 0.4,
              maxOutputTokens: 8192,
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            parsed.isPartnerarbeit = true;
            parsed.partnerModus = partnerModus;
            return NextResponse.json(parsed);
          }
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error("Partnerarbeit konnte nicht generiert werden.");
    }

    // ========================================================================
    // FALL B: REGULÄRES EINZELARBEITSBLATT / KLASSENARBEIT
    // ========================================================================
    const targetCount = Math.min(50, Math.max(1, Number(anzahlAufgaben) || 5));
    const selectedAfb: string[] =
      Array.isArray(afbStufen) && afbStufen.length > 0
        ? afbStufen
        : ["AFB I", "AFB II", "AFB III"];
    const rawSelectedTypes: string[] =
      Array.isArray(aufgabentypen) && aufgabentypen.length > 0
        ? aufgabentypen
        : isMath
        ? ["Rechenaufgaben & Termübungen"]
        : ["Offene Verständnis- & Analysefragen"];

    const isOnlyMC =
      rawSelectedTypes.length === 1 &&
      rawSelectedTypes[0].toLowerCase().includes("multiple-choice");
    const isOnlyCloze =
      rawSelectedTypes.length === 1 &&
      rawSelectedTypes[0].toLowerCase().includes("lückentext");
    const wantsCalcTasks =
      isMath ||
      rawSelectedTypes.some((t) =>
        /rechen|term|gleichung|sachaufgabe|formel/i.test(t)
      );

    const strictTypeInstruction = isOnlyMC
      ? "ZWINGENDE VORGABE (HÖCHSTE PRIORITÄT): Der Nutzer hat AUSSCHLIESSLICH Multiple-Choice ausgewählt! JEDE EINZELNE der " +
        targetCount +
        " Aufgaben im Array aufgaben MUSS eine reine Multiple-Choice-Ankreuzaufgabe sein (" +
        (isMath
          ? "konkrete Rechenaufgabe mit Zahlen/Termen gefolgt von 4 konkreten Ergebnis-Optionen jeweils in einer eigenen Zeile beginnend mit □"
          : "Fragestellung gefolgt von 3–4 Antwortoptionen jeweils in einer eigenen Zeile beginnend mit □") +
        "). Setze bei ALLEN Aufgaben schreiblinien: 0."
      : isOnlyCloze
      ? "ZWINGENDE VORGABE (HÖCHSTE PRIORITÄT): Der Nutzer hat AUSSCHLIESSLICH Lückentext mit Wortbank ausgewählt! JEDE EINZELNE der " +
        targetCount +
        " Aufgaben MUSS ein Lückentext mit Unterstrichen (______) und Wortbank sein! Setze bei ALLEN Aufgaben schreiblinien: 0."
      : "ZWINGENDE VORGABE: Erstelle exakt " +
        targetCount +
        " Aufgaben und verwende AUSSCHLIESSLICH folgende Aufgabentypen: " +
        rawSelectedTypes.join(", ") +
        ". Setze schreiblinien: 0 bei Multiple-Choice und Lückentext.";

    const mathInstruction = wantsCalcTasks
      ? [
          "MATHEMATIK- & RECHENAUFGABEN-MODUS (ZWINGEND!):",
          "- Stelle ECHTE, KONKRETE RECHENAUFGABEN mit konkreten Zahlen, Termen, Brüchen, Gleichungen oder Messwerten – NIEMALS nur allgemeine Textfragen über Mathematik (wie 'Erkläre, was Brüche sind')!",
          "- Nutze typische Mathe-Operatoren (**Berechne**, **Löse**, **Vereinfache**, **Bestimme**, **Wandle um**, **Kürze**, **Zeichne**, **Prüfe**) und strukturiere Übungsaufgaben bei Bedarf übersichtlich mit Teilaufgaben a), b), c), d) (jede Teilaufgabe durch \\n getrennt).",
          "- SCHREIBWEISE: Verwende ausschließlich saubere, druckfertige Unicode-Mathezeichen (· statt *, : für Division, − für Minus, ², ³, √, π, ≤, ≥, ≠, °, ≈, Brüche als 3/4). Verwende NIEMALS rohen LaTeX-Code wie \\frac{1}{2}, \\cdot oder $x^2$!",
          "- RECHENPLATZ: Setze bei Rechen- und Sachaufgaben schreiblinien auf 3 bis 5 (damit genügend Karopapier-Rechenplatz erscheint), bei kurzen Kopfrechenaufgaben auf 2, bei Multiple-Choice auf 0.",
          "- MUSTERLÖSUNG: Gib in musterloesung für JEDE Aufgabe und JEDE Teilaufgabe (a, b, c, ...) den kurzen Rechenweg und das exakt nachgerechnete Endergebnis an. Kontrolliere jede Rechnung doppelt auf Richtigkeit!",
        ].join("\n")
      : isScienceCalc
      ? "FACHHINWEIS NATURWISSENSCHAFTEN: Nutze saubere Einheiten und Unicode-Zeichen (², ³, ·, °C, Ω) statt rohem LaTeX."
      : "";

    const difficultyInstruction =
      "UNABHÄNGIGKEIT VON SCHWIERIGKEIT & AFB: Die gewählte Niveaustufe (" +
      niveau +
      ") bestimmt Sprachkomplexität, Vorwissen und Denktiefe – unabhängig von den gewählten AFB-Stufen.";
    const afbInstruction =
      "ANFORDERUNGSBEREICHE: Verwende AUSSCHLIESSLICH: " + selectedAfb.join(", ") + ".";
    const clarityInstruction =
      "VERSTÄNDLICHKEITSREGEL: Formuliere alle Aufgabenstellungen kurz, klar und altersgerecht für " +
      klassenstufe +
      " (" +
      schulform +
      ")." +
      (wantsCalcTasks
        ? " Konzentriere dich auf klare Rechenaufträge mit eindeutigen Zahlenwerten."
        : " Maximal 1–2 kurze Sätze pro Aufgabenstellung!");
    const compactHint =
      targetCount >= 15
        ? "KOMPAKT-MODUS (" + targetCount + " Aufgaben): Halte Aufgaben und Lösungen prägnant (1–2 Zeilen)."
        : "";

    let formatInstruction = "";
    if (materialFormat === "none") {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = none und einstiegstext = leerer String. Erstelle KEINEN einleitenden Fließtext!";
    } else if (materialFormat === "infobox") {
      formatInstruction = isMath
        ? "WICHTIG ZUM EINSTIEG: Setze materialTyp = infobox. Schreibe eine kompakte Regel- & Formelbox (wichtigste Rechenregel/Formel + genau 1 schrittweise vorgerechnetes Beispiel mit sauberen Unicode-Zeichen)."
        : "WICHTIG ZUM EINSTIEG: Setze materialTyp = infobox. Schreibe eine kompakte Merksatz- & Regelbox (max. 4-6 Bulletpoints).";
    } else if (materialFormat === "schaubild") {
      formatInstruction =
        'WICHTIG ZUM EINSTIEG: Setze materialTyp = "schaubild" und befülle "schaubildSvg" mit einem vollständigen Inline-SVG (<svg viewBox="0 0 600 240" width="600" height="240" xmlns="http://www.w3.org/2000/svg">...</svg>).';
    } else if (materialFormat === "tabelle") {
      formatInstruction = isMath
        ? "WICHTIG ZUM EINSTIEG: Setze materialTyp = tabelle und befülle tabelle mit einer mathematischen Wertetabelle, Zuordnungstabelle oder Datentabelle (3-4 Spalten, 4-6 Zeilen), auf die sich die Rechenaufgaben direkt beziehen."
        : "WICHTIG ZUM EINSTIEG: Setze materialTyp = tabelle und befülle tabelle (3-4 Spalten, 4-6 Zeilen).";
    } else {
      formatInstruction = "WICHTIG ZUM EINSTIEG: Setze materialTyp = text und verfasse einen altersgerechten Informationstext (ca. 130-210 Wörter).";
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
      mathInstruction,
      difficultyInstruction,
      afbInstruction,
      clarityInstruction,
      compactHint,
      "",
      "SPRACHREGEL: Schreibe Aufgabenstellungen UND Antwortoptionen konsequent in derselben Sprache.",
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
      "1. Generiere exakt " + targetCount + " fortlaufend nummerierte Aufgaben (1 bis " + targetCount + ") und " + targetCount + " Lösungen.",
      "2. Setze Operatoren in doppelte Sternchen (**Operator**).",
    ].filter(Boolean).join("\n");

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (fileData?.base64 && fileData?.mimeType) {
      parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.base64 } });
    }
    parts.push({ text: promptText });

    for (const modelName of models) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: [strictTypeInstruction, mathInstruction, afbInstruction, clarityInstruction]
              .filter(Boolean)
              .join("\n"),
            responseMimeType: "application/json",
            responseSchema: worksheetSchema,
            temperature: isMath ? 0.25 : 0.35,
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
