export interface RegionConfig {
  id: string;
  label: string;
  lehrplanName: string;
  isRLPVerified?: boolean;
  schulformen: string[];
  /** Dauer der Grundschule in Jahren (4 in den meisten Ländern, 6 in Berlin/Brandenburg) */
  grundschuleJahre: number;
}

export const REGIONS: RegionConfig[] = [
  {
    id: "berlin",
    label: "Berlin",
    lehrplanName: "Rahmenlehrplan Berlin-Brandenburg",
    isRLPVerified: true,
    grundschuleJahre: 6,
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
    grundschuleJahre: 6,
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
    label: "Bayern",
    lehrplanName: "LehrplanPLUS Bayern",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Mittelschule", "Realschule", "Gymnasium", "FOS / BOS"],
  },
  {
    id: "nrw",
    label: "Nordrhein-Westfalen",
    lehrplanName: "Kernlehrpläne NRW",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Hauptschule", "Realschule", "Sekundarschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "bw",
    label: "Baden-Württemberg",
    lehrplanName: "Bildungsplan Baden-Württemberg",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Werkrealschule", "Realschule", "Gemeinschaftsschule", "Gymnasium"],
  },
  {
    id: "hamburg",
    label: "Hamburg",
    lehrplanName: "Bildungspläne Hamburg",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Stadtteilschule", "Gymnasium"],
  },
  {
    id: "hessen",
    label: "Hessen",
    lehrplanName: "Kerncurriculum Hessen",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Haupt- und Realschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "niedersachsen",
    label: "Niedersachsen",
    lehrplanName: "Kerncurricula Niedersachsen",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Hauptschule", "Realschule", "Oberschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "sachsen",
    label: "Sachsen",
    lehrplanName: "Lehrpläne Sachsen",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Oberschule", "Gymnasium", "Berufsschule"],
  },
  {
    id: "sachsen-anhalt",
    label: "Sachsen-Anhalt",
    lehrplanName: "Fachlehrpläne Sachsen-Anhalt",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Sekundarschule", "Gemeinschaftsschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "thueringen",
    label: "Thüringen",
    lehrplanName: "Lehrpläne Thüringen",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Regelschule", "Gemeinschaftsschule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "rlp",
    label: "Rheinland-Pfalz",
    lehrplanName: "Lehrpläne Rheinland-Pfalz",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Realschule plus", "Integrierte Gesamtschule", "Gymnasium"],
  },
  {
    id: "saarland",
    label: "Saarland",
    lehrplanName: "Kernlehrpläne Saarland",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Gemeinschaftsschule", "Gymnasium"],
  },
  {
    id: "sh",
    label: "Schleswig-Holstein",
    lehrplanName: "Fachanforderungen Schleswig-Holstein",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Gemeinschaftsschule", "Gymnasium"],
  },
  {
    id: "mv",
    label: "Mecklenburg-Vorpommern",
    lehrplanName: "Rahmenpläne Mecklenburg-Vorpommern",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Regionale Schule", "Gesamtschule", "Gymnasium"],
  },
  {
    id: "bremen",
    label: "Bremen",
    lehrplanName: "Bildungspläne Bremen",
    grundschuleJahre: 4,
    schulformen: ["Grundschule", "Oberschule", "Gymnasium"],
  },
];
