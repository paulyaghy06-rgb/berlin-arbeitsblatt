export interface SubjectCurriculum {
  fach: string;
  themen: Record<string, string[]>;
}

export const BERLIN_CONFIG = {
  schulformen: ["Integrierte Sekundarschule (ISS)", "Gymnasium", "Gemeinschaftsschule"],
  klassenstufen: ["5/6", "7/8", "9/10", "Oberstufe (Sek II)"],
  niveaustufen: [
    { id: "basis", label: "Basisniveau (RLP D/E – stark vorstrukturiert)" },
    { id: "standard", label: "Standardniveau (RLP F/G – Regelstandard)" },
    { id: "experte", label: "Expertenniveau (RLP H / Sek II – vertieft)" },
    { id: "daz", label: "DaZ / Sprachsensibel (A2/B1 mit Worterklärungen)" },
  ],
  aufgabentypen: [
    "Offene Verständnis- & Analysefragen (AFB I–III)",
    "Lückentext mit Wortbank",
    "Multiple-Choice-Check (4 Antworten)",
    "Pro- & Kontra-Diskussion / Urteilsbildung",
    "Quellen- bzw. Fallanalyse",
  ],
  dauerOptionen: [
    "Kurz-Einstieg / Sicherung (ca. 15–20 Min., 2 Aufgaben)",
    "Einzelstunde (45 Min., 3–4 Aufgaben)",
    "Doppelstunde / Vertiefung (90 Min., 5 Aufgaben)",
  ],
};

export const BERLIN_SUBJECTS: Record<string, SubjectCurriculum> = {
  Geschichte: {
    fach: "Geschichte",
    themen: {
      "5/6": ["Leben in der Alt- und Jungsteinzeit", "Das alte Ägypten – Hochkultur am Nil", "Die griechische Polis und Demokratie in Athen", "Das Römische Reich – Vom Stadtstaat zum Weltreich"],
      "7/8": ["Städte, Handel und Leben im Mittelalter", "Reformation und Glaubensspaltung", "Aufklärung und Französische Revolution", "Industrialisierung und Soziale Frage (19. Jh.)"],
      "9/10": ["Imperialismus und Erster Weltkrieg", "Die Weimarer Republik – Chancen und Belastungen", "Nationalsozialismus und Zweiter Weltkrieg", "Kalter Krieg und die Teilung Berlins"],
      "Oberstufe (Sek II)": ["Verfassungsentwicklung und Partizipation im 19./20. Jh.", "Die doppelte deutsche Staatsgründung 1949", "Friedliche Revolution 1989 und Wiedervereinigung"],
    },
  },
  "Politische Bildung": {
    fach: "Politische Bildung",
    themen: {
      "5/6": ["Kinderrechte und Mitbestimmung in der Schule", "Mediennutzung und Fake News erkennen"],
      "7/8": ["Demokratie und Wahlen in Berlin und Deutschland", "Rechtsstaat und Jugendstrafrecht", "Soziale Marktwirtschaft und Konsum"],
      "9/10": ["Politisches System der Bundesrepublik Deutschland", "Europäische Union – Chancen und Herausforderungen", "Extremismus und Gefährdungen der Demokratie", "Globale Ungleichheit und Klimapolitik"],
      "Oberstufe (Sek II)": ["Wirtschaftspolitik und Soziale Sicherung", "Internationale Konflikte und Friedenssicherung"],
    },
  },
  Deutsch: {
    fach: "Deutsch",
    themen: {
      "5/6": ["Märchen und Sagen untersuchen", "Vorgangsbeschreibung und Bericht", "Wortarten und Satzglieder sicher anwenden"],
      "7/8": ["Kurzgeschichten analysieren", "Inhaltsangabe und Charakterisierung", "Inhaltsangabe zu Sachtexten und Diagrammen"],
      "9/10": ["Argumentieren und Erörtern (textgebunden & frei)", "Gedichtanalyse (Großstadtlyrik / Expressionismus)", "Sachtextanalyse und Rhetorische Mittel"],
      "Oberstufe (Sek II)": ["Dramenanalyse (Epik, Dramatik, Lyrik im Vergleich)", "Sprachwandel, Sprachkritik und Kommunikationstheorien"],
    },
  },
  Geografie: {
    fach: "Geografie",
    themen: {
      "5/6": ["Orientierung in Berlin, Deutschland und Europa", "Landwirtschaft und Ernährung"],
      "7/8": ["Leben in den Klimazonen der Erde (Tropen, Wüsten, Polarregionen)", "Naturgefahren: Erdbeben und Vulkanismus"],
      "9/10": ["Stadtentwicklung und Gentrifizierung in Berlin", "Globalisierung und globale Warenketten", "Klimawandel und nachhaltige Energieversorgung"],
      "Oberstufe (Sek II)": ["Siedlungsentwicklung und Raumordnung", "Disparitäten in der Einen Welt"],
    },
  },
  Biologie: {
    fach: "Biologie",
    themen: {
      "5/6": ["Bau und Leistung des menschlichen Körpers (Bewegung, Verdauung)", "Wirbeltiere und Anpassung an Lebensräume"],
      "7/8": ["Zelle als Grundbaustein des Lebens & Fotosynthese", "Ökosystem Wald / Gewässer in Brandenburg"],
      "9/10": ["Genetik und Vererbung", "Neurobiologie und Suchtprävention", "Evolution und Artenvielfalt"],
      "Oberstufe (Sek II)": ["Molekulargenetik und Gentechnik", "Ökologie und Nachhaltigkeit"],
    },
  },
};
