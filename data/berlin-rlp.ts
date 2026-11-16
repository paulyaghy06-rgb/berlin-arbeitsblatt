export interface RegionConfig {
  id: string;
  label: string;
  lehrplanName: string;
  schulformen: string[];
}

export const REGIONS: RegionConfig[] = [
  {
    id: "berlin",
    label: "Berlin",
    lehrplanName: "Rahmenlehrplan (RLP) Berlin-Brandenburg",
    schulformen: [
      "Integrierte Sekundarschule (ISS)",
      "Gymnasium",
      "Gemeinschaftsschule",
      "Grundschule (Kl. 1–6)",
      "Berufliche Schule / OSZ",
    ],
  },
  {
    id: "brandenburg",
    label: "Brandenburg / Potsdam",
    lehrplanName: "Rahmenlehrplan (RLP) Berlin-Brandenburg",
    schulformen: [
      "Oberschule",
      "Gymnasium",
      "Gesamtschule",
      "Grundschule (Kl. 1–6)",
      "Oberstufenzentrum (OSZ)",
    ],
  },
  {
    id: "muenchen",
    label: "München / Bayern",
    lehrplanName: "LehrplanPLUS Bayern",
    schulformen: [
      "Gymnasium",
      "Realschule",
      "Mittelschule",
      "Grundschule (Kl. 1–4)",
      "FOS / BOS",
    ],
  },
  {
    id: "hamburg",
    label: "Hamburg",
    lehrplanName: "Bildungsplan Hamburg",
    schulformen: [
      "Stadtteilschule",
      "Gymnasium",
      "Grundschule (Kl. 1–4)",
      "Berufliche Schule",
    ],
  },
  {
    id: "nrw",
    label: "Köln / Düsseldorf / NRW",
    lehrplanName: "Kernlehrplan Nordrhein-Westfalen",
    schulformen: [
      "Gymnasium",
      "Gesamtschule",
      "Realschule",
      "Hauptschule",
      "Grundschule (Kl. 1–4)",
    ],
  },
  {
    id: "bw",
    label: "Stuttgart / Baden-Württemberg",
    lehrplanName: "Bildungsplan Baden-Württemberg",
    schulformen: [
      "Gymnasium",
      "Realschule",
      "Gemeinschaftsschule",
      "Werkrealschule",
      "Grundschule (Kl. 1–4)",
    ],
  },
  {
    id: "hessen",
    label: "Frankfurt / Hessen",
    lehrplanName: "Kerncurriculum Hessen",
    schulformen: [
      "Gymnasium",
      "Integrierte Gesamtschule (IGS)",
      "Realschule",
      "Grundschule (Kl. 1–4)",
    ],
  },
  {
    id: "allgemein",
    label: "Deutschlandweit / Allgemein",
    lehrplanName: "KMK-Bildungsstandards",
    schulformen: [
      "Gymnasium",
      "Gesamtschule / Sekundarschule",
      "Realschule",
      "Grundschule",
      "Berufsschule",
    ],
  },
];

export const KLASSENSTUFEN = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
];

export const WORKSHEET_CONFIG = {
  niveaustufen: [
    { id: "basis", label: "Basisniveau (Grundlegende Anforderungen)" },
    { id: "standard", label: "Standardniveau (Regelstandard)" },
    { id: "experte", label: "Erweitertes Niveau (Vertiefung / Oberstufe)" },
    { id: "daz", label: "Sprachsensibel / DaZ (inkl. Wortbank & Hilfen)" },
  ],
  aufgabentypen: [
    "Offene Verständnis- & Analysefragen",
    "Lückentext mit Wortbank",
    "Multiple-Choice-Check",
    "Pro- & Kontra-Diskussion / Urteilsbildung",
    "Quellen- bzw. Fallanalyse",
  ],
  dauerOptionen: [
    "Einstieg / Kurzübung (15–20 Min., 2 Aufgaben)",
    "Einzelstunde (45 Min., 3–4 Aufgaben)",
    "Doppelstunde / Vertiefung (90 Min., 5–6 Aufgaben)",
  ],
};

export interface SubjectCurriculum {
  fach: string;
  themen: Record<string, string[]>;
}

export const CURRICULUM_SUBJECTS: Record<string, SubjectCurriculum> = {
  Geschichte: {
    fach: "Geschichte",
    themen: {
      "5": ["Einführung in die Geschichte & Zeitrechnung", "Leben in der Alt- und Jungsteinzeit", "Hochkultur am Nil: Das Alte Ägypten"],
      "6": ["Die griechische Polis & Demokratie in Athen", "Das Römische Reich: Republik, Kaiserzeit und Alltag", "Leben im Mittelalter: Stadt, Burg und Kloster"],
      "7": ["Aufbruch in eine neue Zeit: Entdeckungen & Reformation", "Absolutismus und Französische Revolution 1789"],
      "8": ["Industrialisierung und Soziale Frage im 19. Jahrhundert", "Deutsches Kaiserreich & Nationalismus"],
      "9": ["Imperialismus und Erster Weltkrieg", "Die Weimarer Republik: Chancen und Krisen", "Nationalsozialismus und Holocaust"],
      "10": ["Deutschland nach 1945: Teilung und Kalter Krieg", "Friedliche Revolution 1989 und Wiedervereinigung", "Europäische Einigung im 20. Jahrhundert"],
      "11": ["Menschen- und Bürgerrechte in historischer Perspektive", "Moderne und Tradition im 19. Jahrhundert"],
      "12": ["Krisen und Diktaturen im 20. Jahrhundert", "Deutschland und Europa im Ost-West-Konflikt"],
      "13": ["Erinnerungskultur und Geschichtspolitik", "Globalisierung in historischer Perspektive"],
    },
  },
  "Politische Bildung / Sozialkunde": {
    fach: "Politische Bildung / Sozialkunde",
    themen: {
      "5": ["Kinderrechte und Mitbestimmung in der Schule", "Mediennutzung im Alltag"],
      "6": ["Regeln und Gesetze im Zusammenleben", "Nachhaltigkeit und Umweltschutz vor Ort"],
      "7": ["Demokratie vor Ort: Gemeinde, Stadt und Bezirk", "Rechtsstaat und Jugendstrafrecht"],
      "8": ["Soziale Marktwirtschaft und Konsum", "Meinungsbildung in sozialen Netzwerken"],
      "9": ["Politisches System der Bundesrepublik Deutschland", "Wahlen, Parteien und Parlamentarismus", "Sozialstaat und soziale Ungleichheit"],
      "10": ["Die Europäische Union: Institutionen und Herausforderungen", "Internationale Konflikte und Friedenssicherung", "Migration, Integration und Menschenrechte"],
      "11": ["Demokratietheorien und Partizipation", "Wirtschaftspolitik im Spannungsfeld von Markt und Staat"],
      "12": ["Internationale Beziehungen und Sicherheitspolitik", "Globale Umwelt- und Klimapolitik"],
      "13": ["Zukunft der Demokratie im digitalen Zeitalter", "Globale Gerechtigkeit und Weltwirtschaft"],
    },
  },
  Deutsch: {
    fach: "Deutsch",
    themen: {
      "1": ["Laute, Buchstaben und erste Wörter", "Geschichten hören und nacherzählen"],
      "2": ["Satzbau und Satzzeichen entdecken", "Kurze Geschichten lesen und verstehen"],
      "3": ["Wortarten: Nomen, Verben und Adjektive", "Bildergeschichten planen und schreiben"],
      "4": ["Sachtexte erschließen und Fragen beantworten", "Spannend erzählen und Texte überarbeiten"],
      "5": ["Märchen und Sagen untersuchen und schreiben", "Briefe und E-Mails adressatengerecht verfassen"],
      "6": ["Fabeln und Lügengeschichten analysieren", "Berichten und Beschreiben: Vorgangs- und Unfallbericht"],
      "7": ["Balladen untersuchen und gestalten", "Inhaltsangabe zu Kurzgeschichten verfassen"],
      "8": ["Lineare Erörterung und Argumentieren", "Jugendroman und Figurencharakterisierung"],
      "9": ["Dialektische Erörterung zu aktuellen Streitfragen", "Sachtextanalyse und Rhetorische Mittel", "Bewerbung und Lebenslauf"],
      "10": ["Kurzgeschichten der Nachkriegs- und Gegenwartsliteratur", "Dramenanalyse (z. B. Nathan der Weise / Andorra)", "Materialgestütztes Schreiben"],
      "11": ["Epochenumbruch: Aufklärung bis Romantik", "Sprachkritik und Kommunikationstheorien"],
      "12": ["Literatur der Moderne und Gegenwart", "Politische Reden und Rhetorik analysieren"],
      "13": ["Sprachwandel, Mehrsprachigkeit und Medienkritik", "Literatur im gesellschaftlichen Kontext"],
    },
  },
  Geografie: {
    fach: "Geografie",
    themen: {
      "5": ["Orientierung auf der Erde: Karten, Maßstab und Kontinente", "Leben und Wirtschaften in Deutschland"],
      "6": ["Europa: Naturräume, Klima und Tourismus", "Küsten und Hochgebirge im Wandel"],
      "7": ["Klima- und Vegetationszonen der Erde", "Tropischer Regenwald: Ökosystem und Bedrohung"],
      "8": ["Wüsten und Trockenräume: Leben am Limit", "Naturgefahren: Vulkanismus, Erdbeben und Tsunamis"],
      "9": ["Weltbevölkerung, Verstädterung und Megastädte", "Migration und demografischer Wandel"],
      "10": ["Globalisierung: Welthandel und Lieferketten", "Klimawandel und nachhaltige Stadtentwicklung", "Ressourcenkonflikte und Energiewende"],
      "11": ["Siedlungsentwicklung und Raumordnung", "Wirtschaftsräume im Strukturwandel"],
      "12": ["Globale Disparitäten und Entwicklungsstrategien", "Ökosysteme unter Nutzungsdruck"],
      "13": ["Zukunftsfähige Raumnutzung und Global Governance"],
    },
  },
  Biologie: {
    fach: "Biologie",
    themen: {
      "5": ["Kennzeichen des Lebens und Wirbeltiere", "Bau und Funktion von Blütenpflanzen"],
      "6": ["Der menschliche Körper: Bewegung, Atmung und Verdauung", "Gesunde Ernährung und Pubertät"],
      "7": ["Zelle als Grundbaustein des Lebens & Mikroskopie", "Fotosynthese und Stoffkreisläufe im Ökosystem Wald"],
      "8": ["Ökosystem Gewässer und Naturschutz", "Sinnesorgane und Nervensystem"],
      "9": ["Immunbiologie: Infektionskrankheiten und Impfungen", "Hormonsystem und Verhütung"],
      "10": ["Genetik und Vererbung (Mendel, DNA, Mutationen)", "Evolutionstheorien und Stammesgeschichte des Menschen", "Neurobiologie und Suchtprävention"],
      "11": ["Zellbiologie und Stoffwechselphysiologie", "Ökologie und Nachhaltigkeit"],
      "12": ["Molekulargenetik und Gentechnik", "Neurobiologie und Verhaltensbiologie"],
      "13": ["Evolutionsbiologie und Biodiversität"],
    },
  },
  Mathematik: {
    fach: "Mathematik",
    themen: {
      "1": ["Zahlenraum bis 20: Plus und Minus", "Geometrische Grundformen erkennen"],
      "2": ["Zahlenraum bis 100 und Einmaleins", "Längen, Geld und Uhrzeiten"],
      "3": ["Zahlenraum bis 1.000 und schriftliche Addition/Subtraktion", "Symmetrie und Körper"],
      "4": ["Zahlenraum bis 1.000.000 und schriftliche Multiplikation/Division", "Flächeninhalt und Umfang"],
      "5": ["Natürliche Zahlen, Größen und Maßstab", "Geometrische Grundbegriffe und Winkel"],
      "6": ["Bruchrechnung und Dezimalzahlen", "Volumen und Oberfläche von Quadern"],
      "7": ["Prozent- und Zinsrechnung im Alltag", "Rationale Zahlen und erste Terme"],
      "8": ["Lineare Gleichungen und lineare Funktionen", "Kongruenz, Dreiecke und Wahrscheinlichkeit"],
      "9": ["Quadratische Funktionen und Gleichungen", "Satz des Pythagoras und Ähnlichkeit"],
      "10": ["Trigonometrie und Exponentialfunktionen", "Stochastik und Körperberechnungen"],
      "11": ["Einführung in die Differentialrechnung", "Funktionen und Modellierung"],
      "12": ["Integralrechnung und Analytische Geometrie", "Stochastik und Wahrscheinlichkeitsverteilungen"],
      "13": ["Vertiefung Analysis, Vektoren und Hypothesentests"],
    },
  },
};
