export interface RegionConfig {
  id: string;
  label: string;
  lehrplanName: string;
  isRLPVerified?: boolean;
  schulformen: string[];
}

export const REGIONS: RegionConfig[] = [
  {
    id: "berlin",
    label: "Berlin",
    lehrplanName: "Rahmenlehrplan Berlin-Brandenburg",
    isRLPVerified: true,
    schulformen: [
      "Grundschule (Kl. 1–6)",
      "Integrierte Sekundarschule (ISS)",
      "Gymnasium",
      "Gemeinschaftsschule",
      "Berufliche Schule / OSZ",
    ],
  },
  {
    id: "brandenburg",
    label: "Brandenburg",
    lehrplanName: "Rahmenlehrplan Berlin-Brandenburg",
    isRLPVerified: true,
    schulformen: [
      "Grundschule (Kl. 1–6)",
      "Oberschule",
      "Gesamtschule",
      "Gymnasium",
      "Oberstufenzentrum (OSZ)",
    ],
  },
  {
    id: "bayern",
    label: "Bayern (München, Nürnberg, ...)",
    lehrplanName: "LehrplanPLUS Bayern",
    schulformen: ["Grundschule", "Mittelschule", "Realschule", "Gymnasium", "FOS / BOS"],
  },
  {
    id: "nrw",
    label: "Nordrhein-Westfalen",
    lehrplanName: "Kernlehrpläne NRW",
    schulformen: ["Grundschule", "Hauptschule", "Realschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "bw",
    label: "Baden-Württemberg",
    lehrplanName: "Bildungsplan Baden-Württemberg",
    schulformen: ["Grundschule", "Werkrealschule", "Realschule", "Gemeinschaftsschule", "Gymnasium"],
  },
  {
    id: "hamburg",
    label: "Hamburg",
    lehrplanName: "Bildungspläne Hamburg",
    schulformen: ["Grundschule", "Stadtteilschule", "Gymnasium"],
  },
  {
    id: "hessen",
    label: "Hessen",
    lehrplanName: "Kerncurriculum Hessen",
    schulformen: ["Grundschule", "Haupt- und Realschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "allgemein",
    label: "Übrige Bundesländer",
    lehrplanName: "KMK-Bildungsstandards",
    schulformen: ["Grundschule", "Sekundarstufe I", "Gymnasium / Sekundarstufe II", "Berufsschule"],
  },
];

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

// Offizieller Rahmenlehrplan Berlin-Brandenburg (Teil C 1-10 & Sek II) nach Fach & Jahrgangsstufe
export const CURRICULUM_SUBJECTS: Record<string, Record<string, string[]>> = {
  Geschichte: {
    "Klasse 7": [
      "3.1 Antike Lebenswelten: Griechische Polis und Römische Republik",
      "3.2 Lebenswelten im Mittelalter: Herrschaft, Ständeordnung und Religion",
      "3.3 Begegnungen von Kulturen: Christentum, Islam und Judentum im Mittelalter",
    ],
    "Klasse 8": [
      "3.4 Aufbruch in eine neue Zeit: Renaissance, Humanismus und Reformation",
      "3.5 Europäische Expansion und Kolonialisierung der Welt",
      "3.6 Absolutismus und Aufklärung – Wegbereiter der Französischen Revolution",
    ],
    "Klasse 9": [
      "3.7 Demokratie und Nationalstaat im 19. Jahrhundert (1815–1871)",
      "3.8 Industrialisierung und Soziale Frage",
      "3.9 Imperialismus und Erster Weltkrieg (1914–1918)",
    ],
    "Klasse 10": [
      "3.10 Die Weimarer Republik – Chancen und Scheitern der ersten deutschen Demokratie",
      "3.11 Nationalsozialismus, Zweiter Weltkrieg und Holocaust",
      "3.12 Kalter Krieg, Deutsche Teilung (BRD/DDR) und Friedliche Revolution 1989",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Menschenrechte und Verfassungsstaat im historischen Wandel",
      "Einführungsphase: Migration und kulturelle Vielfalt in der Geschichte",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Die Herausbildung moderner Strukturen in Gesellschaft und Staat (19. Jh.)",
      "Q2: Die moderne Welt und ihre Krisen – Demokratie und Diktatur im 20. Jahrhundert",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Die bipolare Welt nach 1945 und das geteilte Deutschland",
      "Q4: Geschichtskultur, Erinnerungsdebatten und historische Identität",
    ],
  },
  "Gesellschaftswissenschaften (5/6)": {
    "Klasse 5": [
      "3.1 Orientierung in Raum und Zeit (Karten, Zeitleiste, Quellen)",
      "3.2 Leben in der Stadt und auf dem Land (Berlin & Brandenburg im Vergleich)",
      "3.3 Vom ersten Menschen zu den frühen Hochkulturen (Ägypten, Mesopotamien)",
    ],
    "Klasse 6": [
      "3.4 Demokratie und Mitbestimmung in Schule, Gemeinde und Kinderrechten",
      "3.5 Europa – Vielfalt der Räume, Kulturen und Lebensweisen",
      "3.6 Wirtschaften und Konsumieren – Bedürfnisse, Geld und Nachhaltigkeit",
    ],
  },
  "Politische Bildung": {
    "Klasse 7": [
      "3.1 Demokratie in der Schule und im Alltag mitgestalten",
      "3.2 Medien und Öffentlichkeit – Meinungsbildung und Fake News erkennen",
    ],
    "Klasse 8": [
      "3.3 Recht und Rechtsstaat – Jugendstrafrecht und Grundrechte",
      "3.4 Soziale Marktwirtschaft – Konsum, Arbeit und soziale Sicherung",
    ],
    "Klasse 9": [
      "3.5 Politisches System der Bundesrepublik Deutschland (Wahlen, Bundestag, Parteien)",
      "3.6 Migration, Integration und gesellschaftlicher Zusammenhalt",
    ],
    "Klasse 10": [
      "3.7 Europäische Union – Institutionen, Binnenmarkt und Herausforderungen",
      "3.8 Internationale Politik, Frieden, Konflikte und globale Nachhaltigkeit",
    ],
    "Klasse 11 (Einführungsphase)": [
      "Einführungsphase: Demokratische Ordnung, Partizipation und Verfassungsprinzipien",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Demokratie und sozialer Wandel in Deutschland",
      "Q2: Wirtschaftspolitik und soziale Gerechtigkeit in der Sozialen Marktwirtschaft",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Internationale Beziehungen, Sicherheitspolitik und Globalisierung",
      "Q4: Zukunft der Demokratie und globale Herausforderungen",
    ],
  },
  Geografie: {
    "Klasse 7": [
      "3.1 Leben in Risikoräumen (Erdbeben, Vulkanismus, Hochwasser)",
      "3.2 Vielfältige Natur- und Kulturräume Europas",
    ],
    "Klasse 8": [
      "3.3 Umgang mit Ressourcen – Wasser, Boden und Energie",
      "3.4 Klima und Klimawandel – Ursachen, Folgen und Anpassungsstrategien",
    ],
    "Klasse 9": [
      "3.5 Armut und Reichtum – Globale Disparitäten und Entwicklungszusammenarbeit",
      "3.6 Migration und Verstädterung – Megacities im Wandel",
    ],
    "Klasse 10": [
      "3.7 Wirtschaftsräume im Wandel – Strukturwandel und Globalisierung",
      "3.8 Zukunftsfähige Raumplanung und nachhaltige Stadtentwicklung (Berlin-Brandenburg)",
    ],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Siedlungsentwicklung und Raumordnung",
      "Q2: Europa – Raumstrukturen im Wandel",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Leben in der Einen Welt – Entwicklungsländer im Spannungsfeld",
      "Q4: Ausgewählte Wirtschaftsregionen im Vergleich",
    ],
  },
  Deutsch: {
    "Klasse 1": ["Anfangsunterricht: Laut-Buchstaben-Zuordnung, erstes Lesen und Schreiben"],
    "Klasse 2": ["Leseflüssigkeit aufbauen, einfache Sätze und kurze Geschichten verfassen"],
    "Klasse 3": ["Sachtexte erschließen, Rechtschreibstrategien und Erzählen nach Bildern"],
    "Klasse 4": ["Leseverstehen vertiefen, Berichte und Briefe schreiben, Wortarten & Satzglieder"],
    "Klasse 5": ["Märchen, Sagen und Fabeln untersuchen, spannend erzählen, Satzglieder"],
    "Klasse 6": ["Jugendbücher und Sachtexte erschließen, sachlich berichten und beschreiben"],
    "Klasse 7": ["Balladen und Kurzgeschichten analysieren, Inhaltsangabe, Konjunktiv"],
    "Klasse 8": ["Lineare Erörterung, Zeitungstexte & Medienkritik, Aktiv und Passiv"],
    "Klasse 9": ["Dialektische Erörterung, Drama und Kurzprosa interpretieren, Bewerbung"],
    "Klasse 10": ["Textgebundene Erörterung (MSA-Vorbereitung), Gedichtanalyse, Rhetorik"],
    "Klasse 11 (Einführungsphase)": ["Einführungsphase: Literarische Epochen im Überblick & Sachtextanalyse"],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Literatur und Sprache um 1800 (Aufklärung, Klassik, Romantik)",
      "Q2: Literatur und Sprache um 1900 bis zur Gegenwart (Moderne & Nachkriegsliteratur)",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Sprache, Denken, Wirklichkeit – Sprachkritik und Medienwandel",
      "Q4: Literarische Wertung und vertiefter Werkvergleich (Abiturvorbereitung)",
    ],
  },
  Mathematik: {
    "Klasse 1": ["Zahlenraum bis 20, Addition und Subtraktion, ebene Grundformen"],
    "Klasse 2": ["Zahlenraum bis 100, Einmaleins (Multiplikation & Division), Längen und Geld"],
    "Klasse 3": ["Zahlenraum bis 1.000, halbschriftliches Rechnen, Gewichte und Zeitspannen"],
    "Klasse 4": ["Zahlenraum bis 1.000.000, schriftliche Rechenverfahren, Flächeninhalt und Umfang"],
    "Klasse 5": ["Natürliche Zahlen, Größen und Einheiten, Geometrische Grundbegriffe, Brüche einführen"],
    "Klasse 6": ["Bruchrechnung & Dezimalzahlen, Winkel und Symmetrie, Daten und Zufall"],
    "Klasse 7": ["Rationale Zahlen, Zuordnungen und Prozentrechnung, Dreiecke und Kongruenz"],
    "Klasse 8": ["Terme und lineare Gleichungen, Lineare Funktionen, Prisma und Zylinder"],
    "Klasse 9": ["Quadratische Funktionen und Gleichungen, Satz des Pythagoras, Ähnlichkeit & Strahlensätze"],
    "Klasse 10": ["Trigonometrie, Potenz- und Exponentialfunktionen, Körperberechnung & Wahrscheinlichkeit (MSA)"],
    "Klasse 11 (Einführungsphase)": ["Einführungsphase: Ganzrationale Funktionen, Ableitungsbegriff und Grundlagen Stochastik"],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Analysis – Differentialrechnung und Kurvendiskussion",
      "Q2: Analysis – Integralrechnung und Exponentialfunktionen",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Analytische Geometrie / Lineare Algebra (Vektoren, Geraden, Ebenen)",
      "Q4: Stochastik – Binomialverteilung und Hypothesentests",
    ],
  },
  Englisch: {
    "Klasse 3": ["First Words & Phrases: Colours, Numbers, Family, Animals and School"],
    "Klasse 4": ["My Day, Hobbies, Food & Drinks, Weather and Seasons"],
    "Klasse 5": ["Me, My Family and Friends, School Life in the UK, Simple Present"],
    "Klasse 6": ["London & Sightseeing, Holidays, Past Simple and Going-to-Future"],
    "Klasse 7": ["UK Regions (Scotland, Wales), Sports & Media, Present Perfect & Conditionals"],
    "Klasse 8": ["USA – New York, California & American Way of Life, Passive Voice & Reported Speech"],
    "Klasse 9": ["Australia & Postcolonial Perspectives, Youth Culture, Work Experience & Applications"],
    "Klasse 10": ["Global Challenges, Environment & Human Rights, Mediation & Exam Prep (MSA)"],
    "Klasse 11 (Einführungsphase)": ["Introductory Phase: Growing Up, Identity & Digital Media"],
    "Klasse 12 (Q1/Q2)": [
      "Q1: The Individual and Society (UK / USA Traditions and Change)",
      "Q2: Globalization, Science, Technology and Ethics",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Postcolonialism, Diversity and Global Challenges",
      "Q4: Visions of the Future & Literary Analysis (Abitur)",
    ],
  },
  Biologie: {
    "Klasse 7": ["3.1 Lebensräume und ihre Bewohner – Ökosystem Wald oder Gewässer", "3.2 Bau und Leistungen des menschlichen Körpers (Bewegung, Atmung, Blutkreislauf)"],
    "Klasse 8": ["3.3 Ernährung und Verdauung – Gesunde Lebensweise", "3.4 Sexualität, Fortpflanzung und Entwicklung des Menschen"],
    "Klasse 9": ["3.5 Zelle, Stoffwechsel und Fotosynthese", "3.6 Informationsaufnahme und -verarbeitung (Nervensystem, Sinne, Hormone)"],
    "Klasse 10": ["3.7 Grundlagen der Genetik und Vererbung", "3.8 Evolution und Vielfalt des Lebens"],
    "Klasse 12 (Q1/Q2)": [
      "Q1: Physiologische Grundlagen ausgewählter Lebensprozesse (Zellbiologie & Stoffwechsel)",
      "Q2: Ökologie und Nachhaltigkeit",
    ],
    "Klasse 13 (Q3/Q4 · Abitur)": [
      "Q3: Grundlagen und Anwendungsfelder der Genetik",
      "Q4: Evolution und Zukunftsfragen",
    ],
  },
  Physik: {
    "Klasse 7": ["3.1 Thermisches Verhalten von Körpern (Temperatur & Wärme)", "3.2 Licht und Schatten – Optik im Alltag"],
    "Klasse 8": ["3.3 Elektrischer Stromkreis, Spannung und Widerstand", "3.4 Kraft und Bewegung – Grundlagen der Mechanik"],
    "Klasse 9": ["3.5 Energieumwandlung, Leistung und Wirkungsgrad", "3.6 Elektromagnetismus und Induktion"],
    "Klasse 10": ["3.7 Radioaktivität und Kernphysik", "3.8 Schwingungen, Wellen und Informationsübertragung"],
    "Klasse 12 (Q1/Q2)": ["Q1: Gravitationsfeld & Elektrisches Feld", "Q2: Magnetisches Feld und Elektromagnetische Induktion"],
    "Klasse 13 (Q3/Q4 · Abitur)": ["Q3: Schwingungen und Wellen", "Q4: Quantenphysik und Atommodelle"],
  },
  Chemie: {
    "Klasse 7": ["3.1 Stoffe und Stoffeigenschaften, Trennverfahren"],
    "Klasse 8": ["3.2 Chemische Reaktion, Luft und Verbrennung (Oxidation)"],
    "Klasse 9": ["3.3 Atombau, Periodensystem und Chemische Bindungen", "3.4 Säuren, Laugen und Neutralisation"],
    "Klasse 10": ["3.5 Organische Chemie – Kohlenwasserstoffe und Alkohole", "3.6 Elektrochemie – Batterien und Korrosion"],
    "Klasse 12 (Q1/Q2)": ["Q1: Chemisches Gleichgewicht und Säure-Base-Reaktionen", "Q2: Elektrochemie und Energetik"],
    "Klasse 13 (Q3/Q4 · Abitur)": ["Q3: Organische Chemie und Reaktionsmechanismen", "Q4: Kunststoffe, Farbstoffe und Naturstoffe"],
  },
  Sachunterricht: {
    "Klasse 1": ["Ich und die anderen – Zusammenleben in der Klasse, Schulweg & Verkehrssicherheit"],
    "Klasse 2": ["Zeit und Kalender – Jahreszeiten, Wochentage und meine Lebensgeschichte"],
    "Klasse 3": ["Natur und Umwelt – Tiere, Pflanzen, Wasser und Wetter beobachten"],
    "Klasse 4": ["Mein Bezirk, Berlin & Brandenburg – Orientierung auf Karten und Demokratie in der Schule"],
  },
  "Ethik / LER": {
    "Klasse 7": ["Identität und Rolle – Wer bin ich und wer will ich sein?"],
    "Klasse 8": ["Freiheit, Verantwortung und Regeln im Zusammenleben"],
    "Klasse 9": ["Gerechtigkeit, Menschenrechte und Umgang mit Konflikten"],
    "Klasse 10": ["Sinn des Lebens, Weltreligionen und ethische Dilemmata in Medizin & Technik"],
  },
};

export const ALL_SUBJECTS: string[] = [
  ...Object.keys(CURRICULUM_SUBJECTS),
  "Informatik",
  "Kunst",
  "Musik",
  "Wirtschaft-Arbeit-Technik (WAT)",
  "Spanisch / Französisch",
  "Sport",
];

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
