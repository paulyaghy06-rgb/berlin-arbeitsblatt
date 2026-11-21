export interface SchulformConfig {
  /** Offizielle Bezeichnung der Schulform im jeweiligen Bundesland */
  name: string;
  /** Niedrigste reguläre Jahrgangsstufe */
  minGrade: number;
  /** Höchste reguläre Jahrgangsstufe */
  maxGrade: number;
  /** True bei 8-jährigem Gymnasium (Abitur nach Klasse 12: EF in Kl. 10, Q1/Q2 in Kl. 11, Q3/Q4 in Kl. 12) */
  isG8?: boolean;
  /** True, wenn die Schulform eine gymnasiale Oberstufe (Sekundarstufe II / Abitur) umfasst */
  hasOberstufe?: boolean;
  /** Kurze Info für die UI, z. B. "Kl. 7–12 · G8" */
  badge: string;
}

export interface GradeOption {
  grade: number;
  label: string;
  /** Zuordnung zu den Themenfeldern in CURRICULUM_SUBJECTS (berücksichtigt G8 vs. G9 Oberstufe) */
  curriculumKey: string;
}

export interface RegionConfig {
  id: string;
  label: string;
  lehrplanName: string;
  isRLPVerified?: boolean;
  /** Dauer der Grundschule in Jahren (6 in Berlin/Brandenburg, 4 in allen anderen Bundesländern) */
  grundschuleJahre: number;
  /** Regelmodell am Gymnasium im jeweiligen Bundesland */
  gymnasiumModel: "G8" | "G9";
  /** Liste der Schulform-Namen (abgeleitet aus schulformDetails) */
  schulformen: string[];
  /** Exakte Jahrgangsstufen-Konfiguration je Schulform */
  schulformDetails: SchulformConfig[];
}

function buildRegion(
  cfg: Omit<RegionConfig, "schulformen">
): RegionConfig {
  return {
    ...cfg,
    schulformen: cfg.schulformDetails.map((s) => s.name),
  };
}

export const REGIONS: RegionConfig[] = [
  buildRegion({
    id: "berlin",
    label: "Berlin",
    lehrplanName: "Rahmenlehrplan Berlin-Brandenburg",
    isRLPVerified: true,
    grundschuleJahre: 6,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule (Kl. 1–6)", minGrade: 1, maxGrade: 6, badge: "Kl. 1–6" },
      { name: "Integrierte Sekundarschule (ISS)", minGrade: 7, maxGrade: 13, hasOberstufe: true, badge: "Kl. 7–13 · G9-Abi" },
      { name: "Gymnasium", minGrade: 7, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 7–12 · G8" },
      { name: "Gemeinschaftsschule", minGrade: 1, maxGrade: 13, hasOberstufe: true, badge: "Kl. 1–13" },
      { name: "Berufliche Schule / OSZ", minGrade: 11, maxGrade: 13, hasOberstufe: true, badge: "Kl. 11–13" },
    ],
  }),
  buildRegion({
    id: "brandenburg",
    label: "Brandenburg",
    lehrplanName: "Rahmenlehrplan Berlin-Brandenburg",
    isRLPVerified: true,
    grundschuleJahre: 6,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule (Kl. 1–6)", minGrade: 1, maxGrade: 6, badge: "Kl. 1–6" },
      { name: "Oberschule", minGrade: 7, maxGrade: 10, badge: "Kl. 7–10" },
      { name: "Gesamtschule", minGrade: 7, maxGrade: 13, hasOberstufe: true, badge: "Kl. 7–13" },
      { name: "Gymnasium", minGrade: 7, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 7–12 · G8" },
      { name: "Oberstufenzentrum (OSZ)", minGrade: 11, maxGrade: 13, hasOberstufe: true, badge: "Kl. 11–13" },
    ],
  }),
  buildRegion({
    id: "bw",
    label: "Baden-Württemberg",
    lehrplanName: "Bildungsplan Baden-Württemberg",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Werkrealschule / Hauptschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Realschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gemeinschaftsschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
      { name: "Berufliches Gymnasium", minGrade: 11, maxGrade: 13, hasOberstufe: true, badge: "Kl. 11–13" },
    ],
  }),
  buildRegion({
    id: "bayern",
    label: "Bayern",
    lehrplanName: "LehrplanPLUS Bayern",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Mittelschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Realschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
      { name: "FOS / BOS", minGrade: 11, maxGrade: 13, hasOberstufe: true, badge: "Kl. 11–13" },
    ],
  }),
  buildRegion({
    id: "bremen",
    label: "Bremen",
    lehrplanName: "Bildungspläne Bremen",
    grundschuleJahre: 4,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Oberschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 5–12 · G8" },
    ],
  }),
  buildRegion({
    id: "hamburg",
    label: "Hamburg",
    lehrplanName: "Bildungspläne Hamburg",
    grundschuleJahre: 4,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Stadtteilschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 5–12 · G8" },
    ],
  }),
  buildRegion({
    id: "hessen",
    label: "Hessen",
    lehrplanName: "Kerncurriculum Hessen",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Haupt- und Realschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gesamtschule (IGS / KGS)", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
    ],
  }),
  buildRegion({
    id: "mv",
    label: "Mecklenburg-Vorpommern",
    lehrplanName: "Rahmenpläne Mecklenburg-Vorpommern",
    grundschuleJahre: 4,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Regionale Schule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gesamtschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 5–12 · G8" },
    ],
  }),
  buildRegion({
    id: "niedersachsen",
    label: "Niedersachsen",
    lehrplanName: "Kerncurricula Niedersachsen",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Hauptschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Realschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Oberschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gesamtschule (IGS / KGS)", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
    ],
  }),
  buildRegion({
    id: "nrw",
    label: "Nordrhein-Westfalen",
    lehrplanName: "Kernlehrpläne NRW",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Hauptschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Realschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Sekundarschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gesamtschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
      { name: "Berufskolleg", minGrade: 11, maxGrade: 13, hasOberstufe: true, badge: "Kl. 11–13" },
    ],
  }),
  buildRegion({
    id: "rlp",
    label: "Rheinland-Pfalz",
    lehrplanName: "Lehrpläne Rheinland-Pfalz",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Realschule plus", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Integrierte Gesamtschule (IGS)", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
    ],
  }),
  buildRegion({
    id: "saarland",
    label: "Saarland",
    lehrplanName: "Kernlehrpläne Saarland",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Gemeinschaftsschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
    ],
  }),
  buildRegion({
    id: "sachsen",
    label: "Sachsen",
    lehrplanName: "Lehrpläne Sachsen",
    grundschuleJahre: 4,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Oberschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 5–12 · G8" },
      { name: "Berufliches Gymnasium", minGrade: 11, maxGrade: 13, hasOberstufe: true, badge: "Kl. 11–13" },
    ],
  }),
  buildRegion({
    id: "sachsen-anhalt",
    label: "Sachsen-Anhalt",
    lehrplanName: "Fachlehrpläne Sachsen-Anhalt",
    grundschuleJahre: 4,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Sekundarschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gemeinschaftsschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gesamtschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 5–12 · G8" },
    ],
  }),
  buildRegion({
    id: "sh",
    label: "Schleswig-Holstein",
    lehrplanName: "Fachanforderungen Schleswig-Holstein",
    grundschuleJahre: 4,
    gymnasiumModel: "G9",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Gemeinschaftsschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13 · G9" },
    ],
  }),
  buildRegion({
    id: "thueringen",
    label: "Thüringen",
    lehrplanName: "Thüringer Lehrpläne",
    grundschuleJahre: 4,
    gymnasiumModel: "G8",
    schulformDetails: [
      { name: "Grundschule", minGrade: 1, maxGrade: 4, badge: "Kl. 1–4" },
      { name: "Regelschule", minGrade: 5, maxGrade: 10, badge: "Kl. 5–10" },
      { name: "Gemeinschaftsschule", minGrade: 1, maxGrade: 13, hasOberstufe: true, badge: "Kl. 1–13" },
      { name: "Gesamtschule", minGrade: 5, maxGrade: 13, hasOberstufe: true, badge: "Kl. 5–13" },
      { name: "Gymnasium", minGrade: 5, maxGrade: 12, isG8: true, hasOberstufe: true, badge: "Kl. 5–12 · G8" },
    ],
  }),
];

export function getSchulformConfig(
  region: RegionConfig,
  schulformName: string
): SchulformConfig {
  return (
    region.schulformDetails.find((s) => s.name === schulformName) ||
    region.schulformDetails[0]
  );
}

/**
 * Liefert die exakt gültigen Jahrgangsstufen für das gewählte Bundesland + Schulform.
 * Berücksichtigt Grundschuldauer (Kl. 1–4 vs. 1–6), Sek-I-Schulen (bis Kl. 10)
 * sowie G8 (Abitur nach Kl. 12) vs. G9 (Abitur nach Kl. 13).
 */
export function getAvailableGrades(
  region: RegionConfig,
  schulformName: string
): GradeOption[] {
  const sf = getSchulformConfig(region, schulformName);
  const options: GradeOption[] = [];

  for (let g = sf.minGrade; g <= sf.maxGrade; g++) {
    if (g <= 9) {
      options.push({
        grade: g,
        label: `Klasse ${g}`,
        curriculumKey: `Klasse ${g}`,
      });
    } else if (g === 10) {
      if (sf.hasOberstufe && sf.isG8) {
        options.push({
          grade: 10,
          label: "Klasse 10 (Einführungsphase)",
          curriculumKey: "Klasse 10",
        });
      } else {
        options.push({
          grade: 10,
          label: "Klasse 10",
          curriculumKey: "Klasse 10",
        });
      }
    } else if (g === 11) {
      if (sf.hasOberstufe && sf.isG8) {
        options.push({
          grade: 11,
          label: "Klasse 11 (Q1/Q2)",
          curriculumKey: "Klasse 12 (Q1/Q2)",
        });
      } else {
        options.push({
          grade: 11,
          label: "Klasse 11 (Einführungsphase)",
          curriculumKey: "Klasse 11 (Einführungsphase)",
        });
      }
    } else if (g === 12) {
      if (sf.hasOberstufe && sf.isG8) {
        options.push({
          grade: 12,
          label: "Klasse 12 (Q3/Q4 · Abitur)",
          curriculumKey: "Klasse 13 (Q3/Q4 · Abitur)",
        });
      } else {
        options.push({
          grade: 12,
          label: "Klasse 12 (Q1/Q2)",
          curriculumKey: "Klasse 12 (Q1/Q2)",
        });
      }
    } else if (g === 13) {
      options.push({
        grade: 13,
        label: "Klasse 13 (Q3/Q4 · Abitur)",
        curriculumKey: "Klasse 13 (Q3/Q4 · Abitur)",
      });
    }
  }

  return options;
}

/** Extrahiert die numerische Klassenstufe aus einem Label wie "Klasse 12 (Q1/Q2)" -> 12 */
export function parseGradeNumber(gradeLabel: string): number {
  const match = gradeLabel.match(/\d+/);
  return match ? Number(match[0]) : 9;
}

/**
 * Findet bei Wechsel von Bundesland oder Schulform automatisch die nächstliegende
 * gültige Klassenstufe (z. B. Klasse 13 -> Klasse 12 bei Wechsel auf Berlin Gymnasium).
 */
export function clampGradeForSchulform(
  currentGradeLabel: string,
  region: RegionConfig,
  schulformName: string
): GradeOption {
  const available = getAvailableGrades(region, schulformName);
  const exact = available.find((o) => o.label === currentGradeLabel);
  if (exact) return exact;

  const currentNum = parseGradeNumber(currentGradeLabel);
  const sameNum = available.find((o) => o.grade === currentNum);
  if (sameNum) return sameNum;

  // Nächstgelegene gültige Stufe (Clamp zwischen min und max)
  if (currentNum < available[0].grade) return available[0];
  return available[available.length - 1];
}
