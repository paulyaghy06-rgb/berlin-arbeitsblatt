// Zentrale Fach- & Altersstufen-Didaktik-Engine für hochwertige 1. Entwürfe

function parseGradeNum(klassenstufe: string): number {
  const m = String(klassenstufe || "").match(/\d+/);
  return m ? Number(m[0]) : 7;
}

export function isMathSubject(fach: string): boolean {
  return String(fach || "").toLowerCase().includes("mathe");
}

export function isForeignLanguage(fach: string): {
  isLang: boolean;
  langName: string;
  isLatin: boolean;
} {
  const f = String(fach || "").toLowerCase();
  if (f.includes("englisch")) return { isLang: true, langName: "Englisch", isLatin: false };
  if (f.includes("franz")) return { isLang: true, langName: "Französisch", isLatin: false };
  if (f.includes("spanisch")) return { isLang: true, langName: "Spanisch", isLatin: false };
  if (f.includes("latein")) return { isLang: true, langName: "Latein", isLatin: true };
  return { isLang: false, langName: "", isLatin: false };
}

export function buildGradeDidacticsInstruction(
  klassenstufe: string,
  schulform: string
): string {
  const grade = parseGradeNum(klassenstufe);

  if (grade <= 2) {
    return [
      `ALTERSSTUFEN-PROFIL (GRUNDSCHULE ${klassenstufe.toUpperCase()} – SEHR WICHTIG):`,
      "- Schreibe in SEHR KURZEN, einfachen Hauptsätzen (maximal 6–8 Wörter pro Satz), motivierend in der Du-Form.",
      "- Wenn ein Einstiegstext gewählt ist: maximal 40–65 Wörter, große Anschaulichkeit, kindgerechter Alltagswortschatz.",
      "- Nutze ausschließlich einfache Grundschul-Operatoren (**Lies**, **Kreise ein**, **Rechne**, **Verbinde**, **Schreibe auf**, **Male an**, **Finde**).",
      "- Vermeide abstrakten Fachjargon und verschachtelte Nebensätze vollständig.",
    ].join("\n");
  }

  if (grade <= 4) {
    return [
      `ALTERSSTUFEN-PROFIL (GRUNDSCHULE ${klassenstufe.toUpperCase()}):`,
      "- Nutze klare, freundliche und kindgerechte Sprache in der Du-Form (kurze, gut lesbare Sätze).",
      "- Einstiegstext (falls gewählt): ca. 80–120 Wörter, spannend und konkret aus der Lebenswelt von Grundschulkindern.",
      "- Nutze verständliche Operatoren (**Lies**, **Nenne**, **Beschreibe**, **Erkläre**, **Ordne zu**, **Berechne**, **Vergleiche**).",
    ].join("\n");
  }

  if (grade <= 10) {
    return [
      `ALTERSSTUFEN-PROFIL (SEKUNDARSTUFE I · ${klassenstufe}, ${schulform || "Sek I"}):`,
      "- Altersgerechte, präzise Fachsprache in der Du-Form; Aufgabenstellungen klar strukturiert und direkt lösbar.",
      "- Einstiegstext (falls gewählt): gehaltvoller Sach- oder Quellentext (ca. 130–200 Wörter) mit konkreten Fakten/Beispielen, aus dem sich die Aufgaben wirklich beantworten lassen.",
      "- Klare Progression von Reproduktion (AFB I) über Anwendung/Transfer (AFB II) zu begründeter Stellungnahme (AFB III).",
    ].join("\n");
  }

  return [
    `ALTERSSTUFEN-PROFIL (GYMNASIALE OBERSTUFE · ${klassenstufe}, ${schulform || "Sek II"}):`,
    "- Wissenschaftspropädeutische, präzise Sprache auf Oberstufen-/Abiturniveau (kein kindlicher Ton).",
    "- Einstiegstext/Material (falls gewählt): substanzieller, quellen- oder fachnaher Textauszug bzw. Datenbasis (ca. 180–260 Wörter) mit klarer analytischer Tiefe.",
    "- Verwende anspruchsvolle KMK-Abitur-Operatoren (**Arbeite heraus**, **Analysiere**, **Stelle dar**, **Vergleiche**, **Erörtere**, **Beurteile kritisch**, **Überprüfe**).",
    "- Formuliere die Musterlösung als differenzierten Erwartungshorizont mit präzisen Fachbegriffen und Argumentationsschritten.",
  ].join("\n");
}

export function buildSubjectDidacticsInstruction(
  fach: string,
  klassenstufe: string,
  wantsCalcTasks: boolean
): string {
  const f = String(fach || "").toLowerCase();
  const grade = parseGradeNum(klassenstufe);
  const lang = isForeignLanguage(fach);

  if (wantsCalcTasks || f.includes("mathe")) {
    return [
      "FACHPROFIL MATHEMATIK & RECHENAUFGABEN (ZWINGEND!):",
      "- Stelle ECHTE, KONKRETE RECHENAUFGABEN mit konkreten Zahlen, Termen, Brüchen, Gleichungen oder Messwerten – NIEMALS nur allgemeine Textfragen über Mathematik (wie 'Erkläre, was Brüche sind')!",
      "- Nutze typische Mathe-Operatoren (**Berechne**, **Löse**, **Vereinfache**, **Bestimme**, **Wandle um**, **Kürze**, **Zeichne**, **Prüfe**) und gliedere Übungsaufgaben übersichtlich in Teilaufgaben a), b), c), d) (jeweils durch \\n getrennt).",
      "- SCHREIBWEISE: Ausschließlich saubere Unicode-Mathezeichen (· statt *, : für Division, − für Minus, ², ³, √, π, ≤, ≥, ≠, °, ≈, Brüche als 3/4). NIEMALS rohen LaTeX-Code wie \\frac{1}{2}, \\cdot oder $x^2$!",
      "- RECHENPLATZ: Setze schreiblinien auf 3–5 bei Rechen-/Sachaufgaben (für Karopapier-Platz), 2 bei kurzen Kopfrechenaufgaben, 0 bei Multiple-Choice.",
      "- MUSTERLÖSUNG: Gib für JEDE Aufgabe und JEDE Teilaufgabe (a, b, c, …) Rechenweg und exakt nachgerechnetes Endergebnis an. Kontrolliere jede Rechnung doppelt!",
    ].join("\n");
  }

  if (lang.isLang && !lang.isLatin) {
    const gerLevel =
      grade <= 4
        ? "Pre-A1/A1 (sehr einfach, spielerisch)"
        : grade <= 6
        ? "A1–A2 (einfacher Alltagswortschatz, kurze Sätze)"
        : grade <= 8
        ? "A2–B1 (solider Schulwortschatz, alltagsnahe Situationen)"
        : grade <= 10
        ? "B1–B1+ (differenzierte Texte & Argumentation)"
        : "B2–C1 (anspruchsvolle authentische Texte, Comment/Analysis)";

    if (grade <= 4) {
      return [
        `FACHPROFIL FREMDSPRACHE ${lang.langName.toUpperCase()} (GRUNDSCHULE · ${gerLevel}):`,
        `- Gestalte die Inhalte spielerisch und kindgerecht auf ${lang.langName} (kurze Wörter, einfache Dialoge/Sätze) mit knappen deutschen Arbeitsanweisungen, damit Grundschulkinder die Aufgabe sicher verstehen.`,
        "- Befülle 'wortliste' mit 5–6 hilfreichen Vokabelpaaren im Format 'Englisches/Fremdsprachiges Wort = deutsche Bedeutung'.",
      ].join("\n");
    }

    return [
      `FACHPROFIL FREMDSPRACHE ${lang.langName.toUpperCase()} (ZWINGEND · NIVEAU ${gerLevel}):`,
      `- SCHREIBE DAS GESAMTE ARBEITSBLATT (Titel, Einstiegstext, Aufgabenstellungen, Antwortoptionen, Merkbox) KONSEQUENT AUF ${lang.langName.toUpperCase()}! (Ausnahme: nur falls eine Aufgabe explizit Sprachmittlung/Mediation aus dem Deutschen verlangt.)`,
      `- Nutze authentische ${lang.langName}-Operatoren (z. B. für Englisch: **Read**, **Fill in**, **Complete**, **Match**, **Explain**, **Analyse**, **Comment on**; analog für ${lang.langName}).`,
      `- Bei Grammatik-Themen: Gib konkrete Übungssätze mit Lücken und Klammervorgaben (z. B. 'Yesterday, Maya ______ (go) to school by bike.'), statt nur Grammatikregeln theoretisch abzufragen!`,
      `- Befülle 'wortliste' als zweisprachige Vocabulary Box mit 5–6 schwierigeren Vokabeln aus dem Text im Format 'Fremdwort = deutsche Übersetzung'.`,
      `- Schreibe auch die Musterlösung konsequent auf ${lang.langName}.`,
    ].join("\n");
  }

  if (lang.isLatin) {
    return [
      "FACHPROFIL LATEIN (ZWINGEND):",
      "- Biete echte, grammatisch korrekte lateinische Beispielsätze oder einen kurzen lateinischen Übungstext passend zum Thema & Jahrgang.",
      "- Befülle 'wortliste' mit präzisen Vokabelangaben (inkl. Stammformen / Genitiv & Genus, z. B. 'amare, amo, amavi, amatum = lieben').",
      "- Stelle konkrete Übersetzungs-, Formenbestimmungs- (KNG, Tempus, Modus) und Satzanalyse-Aufgaben auf Deutsch.",
    ].join("\n");
  }

  if (f.includes("physik")) {
    return [
      "FACHPROFIL PHYSIK (ZWINGEND):",
      "- Integriere konkrete physikalische Rechen- oder Experimentauswertungsaufgaben mit realistischen Messwerten und sauberen SI-Einheiten (m/s, m/s², N, J, W, V, A, Ω, °C, kg/m³).",
      "- Bei Rechenaufgaben erwarte strukturierte Lösung nach Gegeben / Gesucht / Formel / Rechnung / Antwortsatz – gib diesen Rechenweg vollständig in der Musterlösung an!",
      "- Nutze saubere Unicode-Zeichen (², ³, ·, Δ, Ω, °C, ≈), NIEMALS rohen LaTeX-Code.",
    ].join("\n");
  }

  if (f.includes("chemie")) {
    return [
      "FACHPROFIL CHEMIE (ZWINGEND):",
      "- Schreibe chemische Formeln IMMER mit sauberen tiefgestellten Unicode-Ziffern (H₂O, CO₂, O₂, N₂, HCl, NaOH, H₂SO₄, CH₄, Fe₂O₃) und Reaktionspfeil '→' (NIEMALS 'H2O' oder LaTeX!).",
      "- Verbinde Stoffeigenschaften, Teilchenebene und konkrete Reaktionsgleichungen (z. B. Wortgleichung & Ausgleichen von Reaktionsgleichungen, Alltags-/Laborversuche).",
    ].join("\n");
  }

  if (f.includes("biologie")) {
    return [
      "FACHPROFIL BIOLOGIE:",
      "- Arbeite konsequent mit dem Struktur-Funktions-Prinzip, konkreten Fallbeispielen, Experimenten oder Messreihen aus der Natur.",
      "- Verwende präzise biologische Fachbegriffe altersgerecht und erkläre zentrale Begriffe in 'wortliste'.",
    ].join("\n");
  }

  if (f.includes("deutsch")) {
    return [
      "FACHPROFIL DEUTSCH:",
      "- Bei Grammatik-, Rechtschreib- oder Zeichensetzungsthemen: Gib KONKRETE Übungssätze/Fehlertexte zum Einsetzen, Umformen, Markieren oder Korrigieren – frage niemals nur abstrakt Regeln ab!",
      "- Bei Literatur-, Gedicht- oder Sachtextthemen: Schreibe einen wirklich stimmigen, literarisch bzw. journalistisch gut formulierten Beispieltext/Auszug, auf den sich die Aufgaben mit konkreten Textstellen beziehen.",
    ].join("\n");
  }

  if (
    f.includes("geschichte") ||
    f.includes("politik") ||
    f.includes("sozialkunde") ||
    f.includes("gesellschaft") ||
    f.includes("wirtschaft")
  ) {
    return [
      `FACHPROFIL ${fach.toUpperCase()} (GESELLSCHAFTSWISSENSCHAFTEN):`,
      "- Nutze echte Multiperspektivität: Baue im Material konkrete historische Fakten, Jahreszahlen, Akteure oder zwei gegensätzliche Kurz-Positionen/Quellenzitate ein statt eines blassen Lexikoneintrags.",
      "- Trenne in AFB III klar zwischen begründetem Sachurteil und reflektiertem Werturteil.",
    ].join("\n");
  }

  if (f.includes("geografie") || f.includes("erdkunde")) {
    return [
      "FACHPROFIL GEOGRAFIE / ERDKUNDE:",
      "- Arbeite mit einem konkreten Raumbeispiel (Region, Stadt, Fluss, Klimazone) inkl. realistischer Kennzahlen (Niederschlag, Temperatur, Einwohner, Höhenlage) und Mensch-Umwelt-Wechselwirkungen.",
    ].join("\n");
  }

  if (f.includes("informatik")) {
    return [
      "FACHPROFIL INFORMATIK:",
      "- Nutze konkrete, syntaktisch saubere Code-Beispiele (Python, HTML/CSS, SQL oder klarer Pseudocode), Schreibtischtests/Wertetabellen und praxisnahe Debugging-Aufgaben ('Finde und korrigiere den Fehler').",
    ].join("\n");
  }

  if (f.includes("ethik") || f.includes("philosophie") || f.includes("religion")) {
    return [
      `FACHPROFIL ${fach.toUpperCase()}:`,
      "- Beginne idealerweise mit einem konkreten, altersgerechten Alltags-Dilemma oder Fallbeispiel, das zu begründeter Perspektivübernahme und eigenständiger Urteilsbildung anregt.",
    ].join("\n");
  }

  if (f.includes("sachunterricht")) {
    return [
      "FACHPROFIL SACHUNTERRICHT (GRUNDSCHULE):",
      "- Knüpfe an konkrete Alltags- und Naturbeobachtungen von Kindern an (Entdecken, Vergleichen, Zuordnen, einfache Forscherfragen).",
    ].join("\n");
  }

  return "";
}

export function buildExamDidacticsInstruction(
  isExam: boolean,
  targetCount: number
): string {
  if (!isExam) return "";
  return [
    "PRÜFUNGS- & KLASSENARBEIT-QUALITÄT (ZWINGEND):",
    `- Verteile die ${targetCount} Aufgaben ausgewogen über die Anforderungsbereiche (Richtwert: ~30 % AFB I, ~45 % AFB II, ~25 % AFB III, ansteigend geordnet).`,
    "- Vergib realistische, zur Aufgabentiefe passende Punktzahlen (z. B. 2–4 P. für AFB I, 4–8 P. für AFB II, 6–10 P. für AFB III).",
    "- ERWARTUNGSHORIZONT MIT TEILPUNKTEN: Gib in 'musterloesung' bei jeder Aufgabe konkrete Teilpunkte in eckigen Klammern an (z. B. '[2 P.] Korrekter Ansatz ... [2 P.] Richtiges Ergebnis ...'), sodass die Lehrkraft direkt danach korrigieren kann!",
  ].join("\n");
}
