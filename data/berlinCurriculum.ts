import {
  getAvailableGrades,
  getSchulformConfig,
  parseGradeNumber,
  type RegionConfig,
  type SchulformConfig,
  type GradeOption,
} from "./regions";

export {
  REGIONS,
  getAvailableGrades,
  getSchulformConfig,
  parseGradeNumber,
  clampGradeForSchulform,
} from "./regions";
export type { RegionConfig, SchulformConfig, GradeOption };

export const KLASSENSTUFEN: string[] = [
  "Klasse 1",
  "Klasse 2",
  "Klasse 3",
  "Klasse 4",
  "Klasse 5",
  "Klasse 6",
  "Klasse 7",
  "Klasse 8",
  "Klasse 9",
  "Klasse 10",
  "Klasse 11 (Einführungsphase)",
  "Klasse 12 (Q1/Q2)",
  "Klasse 13 (Q3/Q4 · Abitur)",
];

// Jedes Themenfeld ist separat auswählbar (kein Zusammenfassen verschiedener Unterrichtseinheiten)
export const CURRICULUM_SUBJECTS: Record<string, Record<string, string[]>> = {
  Deutsch: {
    "Klasse 1": [
      "Laut-Buchstaben-Zuordnung & Anlaute",
      "Erste Wörter und kurze Sätze lesen",
      "Erste eigene Sätze schreiben",
    ],
    "Klasse 2": [
      "Leseflüssigkeit und Leseverständnis",
      "Kurze Geschichten verfassen",
      "Nomen, Verben und Adjektive erkennen",
    ],
    "Klasse 3": [
      "Sachtexte lesen und Informationen entnehmen",
      "Erzählen nach Bildern (Reizwortgeschichte)",
      "Rechtschreibstrategien (Silbenschwingen, Verlängern, Ableiten)",
      "Wortarten und Zeitformen (Präsens, Präteritum)",
    ],
    "Klasse 4": [
      "Leseverstehen: Literarische Texte und Sachtexte",
      "Berichte und persönliche Briefe verfassen",
      "Satzglieder bestimmen (Subjekt, Prädikat, Objekte)",
      "Wörtliche Rede und Zeichensetzung",
    ],
    "Klasse 5": [
      "Märchen untersuchen und selbst schreiben",
      "Sagen und Fabeln erschließen",
      "Spannend erzählen (Erzählkern ausgestalten)",
      "Wortarten vertiefen und Satzglieder bestimmen",
    ],
    "Klasse 6": [
      "Jugendbücher und Erzähltexte untersuchen",
      "Sachtexte erschließen und zusammenfassen",
      "Sachlich berichten und beschreiben (Vorgangs-/Personenbeschreibung)",
      "Rechtschreibung: Groß- und Kleinschreibung, das/dass",
    ],
    "Klasse 7": [
      "Balladen untersuchen und gestalten",
      "Kurzgeschichten erschließen",
      "Inhaltsangabe verfassen",
      "Grammatik: Konjunktiv I und II (indirekte Rede)",
      "Adverbialsätze und Kommasetzung",
    ],
    "Klasse 8": [
      "Lineare Erörterung schreiben",
      "Zeitungstexte und Medienkritik untersuchen",
      "Kurzgeschichten und Novellen analysieren",
      "Grammatik: Aktiv und Passiv",
    ],
    "Klasse 9": [
      "Dialektische Erörterung (Pro- und Kontra-Argumentation)",
      "Dramenszenen untersuchen und interpretieren",
      "Kurzprosa und Parabeln analysieren",
      "Bewerbungsschreiben und Lebenslauf verfassen",
    ],
    "Klasse 10": [
      "Textgebundene Erörterung (Abschlussvorbereitung)",
      "Gedichtanalyse und lyrische Stilmittel",
      "Rhetorik und politische Reden analysieren",
      "Sachtextanalyse und Materialgestütztes Schreiben",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Literarische Epochen im Überblick",
      "Einführungsphase: Sachtextanalyse und Argumentationsstruktur",
      "Einführungsphase: Dramenanalyse",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Literatur und Sprache der Aufklärung",
      "Q1: Weimarer Klassik und Romantik",
      "Q2: Literatur der Moderne (um 1900)",
      "Q2: Nachkriegsliteratur und Gegenwartsliteratur",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Sprache, Denken und Wirklichkeit (Sprachkritik)",
      "Q3: Medienwandel und Sprachvarietäten",
      "Q4: Literarischer Werkvergleich (Abiturvorbereitung)",
    ],
  },
  Mathematik: {
    "Klasse 1": [
      "Zahlenraum bis 20 (Zählen, Vergleichen, Zerlegen)",
      "Addition und Subtraktion bis 20",
      "Ebene Grundformen (Kreis, Dreieck, Quadrat, Rechteck)",
    ],
    "Klasse 2": [
      "Zahlenraum bis 100",
      "Einmaleins: Multiplikation und Division",
      "Rechnen mit Geld (Euro und Cent)",
      "Längen messen (cm und m) und Uhrzeit",
    ],
    "Klasse 3": [
      "Zahlenraum bis 1.000",
      "Halbschriftliches und schriftliches Addieren/Subtrahieren",
      "Gewichte (g und kg) und Zeitspannen",
      "Geometrische Körper und Symmetrie",
    ],
    "Klasse 4": [
      "Zahlenraum bis 1.000.000",
      "Schriftliche Multiplikation und Division",
      "Flächeninhalt und Umfang von Rechtecken",
      "Diagramme lesen und erstellen",
    ],
    "Klasse 5": [
      "Natürliche Zahlen und Stellenwertsystem",
      "Größen und Einheiten umrechnen (Länge, Masse, Zeit)",
      "Geometrische Grundbegriffe (Gerade, Strecke, Winkel, Koordinatensystem)",
      "Brüche entdecken und darstellen",
    ],
    "Klasse 6": [
      "Bruchrechnung: Erweitern, Kürzen, Addieren und Subtrahieren",
      "Bruchrechnung: Multiplizieren und Dividieren",
      "Dezimalzahlen und Rechnen mit Dezimalbrüchen",
      "Winkel messen, zeichnen und Achsensymmetrie",
      "Daten und Zufall (Häufigkeiten, Mittelwert)",
    ],
    "Klasse 7": [
      "Rationale Zahlen (Negative Zahlen ordnen und rechnen)",
      "Proportionale und antiproportionale Zuordnungen",
      "Prozentrechnung und Zinsrechnung",
      "Dreiecke konstruieren und Kongruenzsätze",
    ],
    "Klasse 8": [
      "Terme aufstellen, vereinfachen und ausmultiplizieren",
      "Lineare Gleichungen und Ungleichungen lösen",
      "Lineare Funktionen (Steigung, y-Achsenabschnitt, Graphen)",
      "Flächeninhalt von Vielecken, Prisma und Zylinder",
    ],
    "Klasse 9": [
      "Quadratische Funktionen (Normalparabel, Scheitelpunktform)",
      "Quadratische Gleichungen lösen (pq-Formel)",
      "Satz des Pythagoras und Kathetensatz",
      "Ähnlichkeit und Strahlensätze",
    ],
    "Klasse 10": [
      "Trigonometrie (Sinus, Kosinus, Tangens im Dreieck)",
      "Potenz- und Exponentialfunktionen (Wachstumsprozesse)",
      "Körperberechnung (Pyramide, Kegel, Kugel)",
      "Mehrstufige Zufallsversuche und Baumdiagramme",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Ganzrationale Funktionen",
      "Einführungsphase: Änderungsrate und Ableitungsbegriff",
      "Einführungsphase: Grundlagen der Stochastik",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Differentialrechnung und Kurvendiskussion",
      "Q1: Extremwertaufgaben und Funktionsscharen",
      "Q2: Integralrechnung und Flächenberechnung",
      "Q2: Exponentialfunktionen in Sachzusammenhängen",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Vektoren, Geraden und Ebenen im Raum",
      "Q3: Lagebeziehungen und Abstände in der Analytischen Geometrie",
      "Q4: Binomialverteilung und Erwartungswert",
      "Q4: Hypothesentests (Signifikanztest)",
    ],
  },
  Englisch: {
    "Klasse 3": [
      "First Words: Colours, Numbers and School Things",
      "Family, Pets and Animals",
    ],
    "Klasse 4": [
      "My Day, Hobbies and Free Time",
      "Food, Drinks and Shopping",
      "Weather, Clothes and Seasons",
    ],
    "Klasse 5": [
      "Me, My Family and Friends",
      "School Life in the UK",
      "Grammar: Simple Present & Have Got / To Be",
    ],
    "Klasse 6": [
      "London and Sightseeing",
      "Holidays and Travelling",
      "Grammar: Simple Past & Going-to-Future",
    ],
    "Klasse 7": [
      "UK Regions: Scotland, Wales and Northern Ireland",
      "Sports, Music and Digital Media",
      "Grammar: Present Perfect & Conditional Clauses (If-Sätze)",
    ],
    "Klasse 8": [
      "USA: New York, California and American Way of Life",
      "Teenage Life, Rules and Conflicts",
      "Grammar: Passive Voice & Reported Speech",
    ],
    "Klasse 9": [
      "Australia: History, Nature and Indigenous Perspectives",
      "Future Plans, Work Experience and Job Applications",
      "Grammar: Gerund, Infinitive & Participles",
    ],
    "Klasse 10": [
      "Global Challenges: Environment and Sustainability",
      "Human Rights, Democracy and Youth Engagement",
      "Mediation & Exam Preparation",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Introductory Phase: Growing Up and Identity",
      "Introductory Phase: Digital Media and Society",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: The UK – Tradition and Change in a Multicultural Society",
      "Q1: The USA – The American Dream between Myth and Reality",
      "Q2: Globalization and Global Challenges",
      "Q2: Science, Technology and Ethical Dilemmas",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Postcolonialism and Diversity in the English-Speaking World",
      "Q4: Visions of the Future & Literary Analysis (Abitur)",
    ],
  },
  Geschichte: {
    "Klasse 5": [
      "Orientierung in der Zeit: Quellen, Zeitleiste und Archäologie",
      "Leben in der Alt- und Jungsteinzeit",
      "Frühe Hochkulturen: Das Alte Ägypten",
    ],
    "Klasse 6": [
      "Antike Lebenswelten: Griechische Polis und Demokratie",
      "Das Römische Weltreich: Republik, Kaiserzeit und Alltag",
      "Übergang zum Mittelalter: Frankenreich und Karl der Große",
    ],
    "Klasse 7": [
      "3.1 Antike Lebenswelten: Griechische Polis und Demokratie",
      "3.1 Antike Lebenswelten: Römische Republik und Kaiserreich",
      "3.2 Lebenswelten im Mittelalter: Herrschaft und Ständeordnung",
      "3.3 Begegnungen von Kulturen: Christentum, Islam und Judentum",
    ],
    "Klasse 8": [
      "3.4 Renaissance, Humanismus und Reformation",
      "3.5 Europäische Expansion und Kolonialisierung",
      "3.6 Absolutismus und Aufklärung",
      "3.6 Die Französische Revolution (1789)",
    ],
    "Klasse 9": [
      "3.7 Demokratie und Nationalstaat im 19. Jahrhundert (1848 & 1871)",
      "3.8 Industrialisierung und Soziale Frage",
      "3.9 Imperialismus und Kolonialpolitik",
      "3.9 Der Erste Weltkrieg (1914–1918)",
    ],
    "Klasse 10": [
      "3.10 Die Weimarer Republik (1918–1933)",
      "3.11 Nationalsozialismus und Zweiter Weltkrieg",
      "3.11 Holocaust und Widerstand",
      "3.12 Kalter Krieg, Deutsche Teilung (BRD/DDR) und Mauerfall 1989",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Menschenrechte und Verfassungsstaat",
      "Einführungsphase: Migration und kulturelle Vielfalt",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Herausbildung moderner Strukturen in Gesellschaft und Staat",
      "Q2: Demokratie und Diktatur im 20. Jahrhundert",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Die bipolare Welt nach 1945 und das geteilte Deutschland",
      "Q4: Geschichtskultur und Erinnerungsdebatten",
    ],
  },
  "Gesellschaftswissenschaften (5/6)": {
    "Klasse 5": [
      "3.1 Orientierung in Raum und Zeit (Karten, Zeitleiste, Quellen)",
      "3.2 Leben in der Stadt und auf dem Land (Berlin & Brandenburg)",
      "3.3 Frühe Hochkulturen: Das Alte Ägypten",
    ],
    "Klasse 6": [
      "3.4 Demokratie, Mitbestimmung und Kinderrechte",
      "3.5 Europa – Vielfalt der Räume und Kulturen",
      "3.6 Wirtschaften, Konsumieren und Nachhaltigkeit",
    ],
  },
  "Politische Bildung": {
    "Klasse 5": [
      "Zusammenleben in Klasse, Schule und Gemeinde",
      "Kinderrechte und demokratische Mitbestimmung",
    ],
    "Klasse 6": [
      "Umgang mit Medien, Werbung und Taschengeld",
      "Regeln, Gesetze und faires Streiten",
    ],
    "Klasse 7": [
      "3.1 Demokratie in der Schule und im Alltag mitgestalten",
      "3.2 Medien, Meinungsbildung und Fake News erkennen",
    ],
    "Klasse 8": [
      "3.3 Recht, Rechtsstaat und Jugendstrafrecht",
      "3.4 Soziale Marktwirtschaft und Konsum",
    ],
    "Klasse 9": [
      "3.5 Politisches System der Bundesrepublik Deutschland",
      "3.6 Migration, Integration und gesellschaftlicher Zusammenhalt",
    ],
    "Klasse 10": [
      "3.7 Europäische Union: Institutionen und Herausforderungen",
      "3.8 Internationale Politik, Frieden und globale Nachhaltigkeit",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Demokratische Ordnung und Verfassungsprinzipien",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Demokratie und sozialer Wandel in Deutschland",
      "Q2: Wirtschaftspolitik in der Sozialen Marktwirtschaft",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Internationale Beziehungen und Sicherheitspolitik",
      "Q4: Zukunft der Demokratie und Globalisierung",
    ],
  },
  Geografie: {
    "Klasse 5": [
      "Orientierung auf der Erde: Karten, Maßstab und Himmelsrichtungen",
      "Deutschland: Großlandschaften von der Küste bis zu den Alpen",
      "Landwirtschaft und Ernährung im Wandel",
    ],
    "Klasse 6": [
      "Europa: Staaten, Naturräume und Klima",
      "Tourismus in Europa (Alpen und Mittelmeerraum)",
      "Wetter, Klimadiagramme und Jahreszeiten",
    ],
    "Klasse 7": [
      "3.1 Leben in Risikoräumen (Erdbeben, Vulkanismus, Hochwasser)",
      "3.2 Natur- und Kulturräume Europas",
    ],
    "Klasse 8": [
      "3.3 Umgang mit Ressourcen: Wasser, Boden und Energie",
      "3.4 Klima und Klimawandel",
    ],
    "Klasse 9": [
      "3.5 Armut und Reichtum: Globale Disparitäten",
      "3.6 Migration und Verstädterung (Megacities)",
    ],
    "Klasse 10": [
      "3.7 Wirtschaftsräume im Strukturwandel und Globalisierung",
      "3.8 Nachhaltige Stadtentwicklung (Berlin-Brandenburg)",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Geoökosysteme und nachhaltige Raumnutzung",
      "Einführungsphase: Klimawandel und globale Wasserversorgung",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Siedlungsentwicklung und Raumordnung",
      "Q2: Europa – Raumstrukturen im Wandel",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Entwicklungsländer im Spannungsfeld",
      "Q4: Ausgewählte Wirtschaftsregionen im Vergleich",
    ],
  },
  Biologie: {
    "Klasse 5": [
      "Kennzeichen des Lebens und Wirbeltiere im Vergleich",
      "Säugetiere in ihren Lebensräumen (Haustiere & Wildtiere)",
      "Blütenpflanzen: Aufbau, Bestäubung und Wachstum",
    ],
    "Klasse 6": [
      "Bewegungssystem des Menschen: Skelett, Gelenke und Muskeln",
      "Atmung, Blutkreislauf und gesunde Ernährung",
      "Pubertät, Entwicklung und Verantwortung",
    ],
    "Klasse 7": [
      "3.1 Ökosystem Wald oder Gewässer",
      "3.2 Bau und Leistungen des menschlichen Körpers (Bewegung, Atmung, Blutkreislauf)",
    ],
    "Klasse 8": [
      "3.3 Ernährung, Verdauung und gesunde Lebensweise",
      "3.4 Sexualität, Fortpflanzung und Entwicklung",
    ],
    "Klasse 9": [
      "3.5 Zelle, Stoffwechsel und Fotosynthese",
      "3.6 Nervensystem, Sinnesorgane und Hormone",
    ],
    "Klasse 10": [
      "3.7 Grundlagen der Genetik und Vererbung",
      "3.8 Evolution und Vielfalt des Lebens",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Zellbiologie, Biomembranen und Enzymatik",
      "Einführungsphase: Zellatmung und Fotosynthese",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Zellbiologie und Stoffwechselphysiologie",
      "Q2: Ökologie und Nachhaltigkeit",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Molekulargenetik und Gentechnik",
      "Q4: Evolutionstheorien und Stammesgeschichte",
    ],
  },
  Physik: {
    "Klasse 5": [
      "Magnetismus und einfache Stromkreise",
      "Licht, Schatten und Sonnenfinsternis",
    ],
    "Klasse 6": [
      "Schall, Akustik und Hören",
      "Temperatur, Thermometer und Aggregatzustände",
    ],
    "Klasse 7": [
      "3.1 Temperatur und Wärme (Thermisches Verhalten)",
      "3.2 Optik: Licht, Schatten, Reflexion und Brechung",
    ],
    "Klasse 8": [
      "3.3 Elektrischer Stromkreis, Spannung und Widerstand",
      "3.4 Mechanik: Kraft, Masse und Bewegung",
    ],
    "Klasse 9": [
      "3.5 Energieumwandlung, Leistung und Wirkungsgrad",
      "3.6 Elektromagnetismus und Induktion",
    ],
    "Klasse 10": [
      "3.7 Radioaktivität und Kernphysik",
      "3.8 Schwingungen und Wellen",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Kinematik und Dynamik (Newtonsche Gesetze)",
      "Einführungsphase: Energie- und Impulserhaltung",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Gravitationsfeld und Elektrisches Feld",
      "Q2: Magnetisches Feld und Induktion",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Mechanische und elektromagnetische Wellen",
      "Q4: Quantenphysik und Atommodelle",
    ],
  },
  Chemie: {
    "Klasse 7": [
      "3.1 Stoffe, Stoffeigenschaften und Trennverfahren",
    ],
    "Klasse 8": [
      "3.2 Chemische Reaktion, Luft und Verbrennung (Oxidation)",
    ],
    "Klasse 9": [
      "3.3 Atombau, Periodensystem und Chemische Bindungen",
      "3.4 Säuren, Laugen und Neutralisation",
    ],
    "Klasse 10": [
      "3.5 Organische Chemie: Kohlenwasserstoffe und Alkohole",
      "3.6 Elektrochemie: Batterien und Korrosion",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Organische Chemie – Alkane, Alkene und Alkohole",
      "Einführungsphase: Reaktionsgeschwindigkeit und chemisches Gleichgewicht",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Chemisches Gleichgewicht und Säure-Base-Reaktionen",
      "Q2: Elektrochemie und Energetik",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Organische Reaktionsmechanismen",
      "Q4: Kunststoffe, Farbstoffe und Naturstoffe",
    ],
  },
  Sachunterricht: {
    "Klasse 1": [
      "Zusammenleben in der Klasse und Schule",
      "Schulweg und Verkehrssicherheit",
    ],
    "Klasse 2": [
      "Zeit, Kalender und Jahreszeiten",
      "Meine Lebensgeschichte und Familie",
    ],
    "Klasse 3": [
      "Tiere und Pflanzen in unserem Lebensraum",
      "Wasser, Luft und Wetter beobachten",
    ],
    "Klasse 4": [
      "Mein Bezirk, Berlin und Brandenburg auf Karten",
      "Demokratie, Klassensprecher und Kinderrechte",
    ],
  },
  "Ethik / LER": {
    "Klasse 5": ["Freundschaft, Fairness und Zusammenleben"],
    "Klasse 6": ["Wünsche, Werte und Vorbilder"],
    "Klasse 7": ["Identität und Rolle: Wer bin ich?"],
    "Klasse 8": ["Freiheit, Verantwortung und Regeln"],
    "Klasse 9": ["Gerechtigkeit, Menschenrechte und Konfliktlösung"],
    "Klasse 10": ["Weltreligionen und ethische Dilemmata in Medizin & Technik"],
    "Klasse 11 (Einführungsphase)": ["Einführungsphase: Moral, Ethik und Menschenbild"],
    "Klasse 12 (Q1/Q2)": ["Q1/Q2: Ethische Positionen (Pflichtethik, Utilitarismus, Tugendethik)"],
    "Klasse 13 (Q3/Q4 · Abitur)": ["Q3/Q4: Gerechtigkeit, Freiheit und angewandte Ethik (KI & Medizin)"],
  },
};

export const ALL_SUBJECTS: string[] = [
  ...Object.keys(CURRICULUM_SUBJECTS),
  "Informatik",
  "Kunst",
  "Musik",
  "Wirtschaft-Arbeit-Technik (WAT)",
  "Französisch",
  "Spanisch",
  "Sport",
];

/**
 * Filtert Fächer sinnvoll nach Bundesland und Jahrgangsstufe:
 * - "Gesellschaftswissenschaften (5/6)" nur in Berlin & Brandenburg in Kl. 5–6
 * - "Sachunterricht" nur in der Grundschule (Kl. 1–4 bzw. Kl. 1–6 in Berlin/BB)
 */
export function getSubjectsForContext(
  region: RegionConfig,
  schulformName: string,
  gradeLabel: string
): string[] {
  const gradeNum = parseGradeNumber(gradeLabel);
  const isBerlinBB = region.id === "berlin" || region.id === "brandenburg";
  const isGrundschuleGrade = gradeNum <= region.grundschuleJahre;

  return ALL_SUBJECTS.filter((subject) => {
    if (subject === "Gesellschaftswissenschaften (5/6)") {
      return isBerlinBB && (gradeNum === 5 || gradeNum === 6);
    }
    if (subject === "Sachunterricht") {
      return isGrundschuleGrade && gradeNum <= 4;
    }
    // In der Grundschule Kl. 1–4 typischerweise kein Chemie/Physik als Einzelfach ausblenden?
    // Nein, manche Lehrkräfte suchen gezielt danach – nur klar landesspezifische Fächer filtern.
    void schulformName;
    return true;
  });
}

/**
 * Liefert passende Lehrplan-Themen für jedes Bundesland, Schulform, Fach und Klassenstufe.
 * - Berlin & Brandenburg: exakte RLP Berlin-Brandenburg Themen inkl. Kapitelnummern (G8/G9-aware)
 * - Alle anderen 14 Bundesländer: KMK-/Lehrplan-abgestimmte Themen angepasst an das Bundesland & G8/G9
 */
export function getCurriculumTopicsForRegion(
  region: RegionConfig,
  schulformName: string,
  fach: string,
  gradeLabel: string
): string[] {
  const subjectMap = CURRICULUM_SUBJECTS[fach];
  if (!subjectMap) return [];

  const available = getAvailableGrades(region, schulformName);
  const matchedOption = available.find((o) => o.label === gradeLabel);
  const sf = getSchulformConfig(region, schulformName);
  const curriculumKey = matchedOption?.curriculumKey || gradeLabel;

  let rawTopics: string[] = subjectMap[curriculumKey] || [];

  // Im G8-Gymnasium ist Klasse 10 sowohl MSA-Jahr als auch Einführungsphase (EF)
  if (
    matchedOption?.grade === 10 &&
    sf.isG8 &&
    sf.hasOberstufe &&
    subjectMap["Klasse 11 (Einführungsphase)"]
  ) {
    const efTopics = subjectMap["Klasse 11 (Einführungsphase)"];
    rawTopics = [...rawTopics, ...efTopics];
  }

  if (region.isRLPVerified) {
    return rawTopics;
  }

  // Für die übrigen 14 Bundesländer: Berlin-Brandenburg-spezifische Kapitelnummern & Ortsbezüge neutralisieren
  return rawTopics.map((topic) =>
    topic
      .replace(/^3\.\d+\s+/, "")
      .replace(/Mein Bezirk, Berlin und Brandenburg auf Karten/g, `Meine Region und ${region.label} auf Karten`)
      .replace(/\(Berlin-Brandenburg\)/g, `(${region.label})`)
      .replace(/\(Berlin & Brandenburg\)/g, `(${region.label})`)
  );
}

export const NIVEAUSTUFEN = [
  {
    id: "basis",
    label: "Basisniveau (Förderbedarf / DaZ-sensibel)",
    description: "Einfachere Satzstrukturen, Wortliste für Fachbegriffe, kleinschrittige Operatoren (AFB I–II), Niveaustufe D/E.",
  },
  {
    id: "standard",
    label: "Standardniveau (Regelstandard)",
    description: "Ausgewogener Mix aus Reproduktion, Transfer und Urteilsbildung (AFB I–III), Niveaustufe F/G.",
  },
  {
    id: "erweitert",
    label: "Erweitertes Niveau (Vertiefung / Oberstufe)",
    description: "Anspruchsvolle Quellentexte, komplexe Analyse- und Bewertungsoperatoren (AFB II–III), Niveaustufe G/H.",
  },
];

export const AUFGABENTYPEN = [
  "Offene Verständnis- & Analysefragen",
  "Lückentext mit Wortbank",
  "Multiple-Choice-Check",
  "Pro- & Kontra-Diskussion / Urteilsbildung",
  "Quellen- bzw. Fallanalyse",
];
