// Deutsche Silbentrennungs-Heuristik für Grundschul-Silbenschrift (Blau / Rot)

const VOWEL_RE = /[aeiouäöüyAEIOUÄÖÜY]/;
const DIGRAPH_VOWELS = new Set(["ei", "ai", "au", "eu", "äu", "ie"]);
const INSEPARABLE_CLUSTERS = new Set(["sch", "ch", "ck", "ph", "th", "qu", "ng"]);
const PREFIXES = [
  "ge",
  "be",
  "ver",
  "zer",
  "ent",
  "emp",
  "er",
  "un",
  "ab",
  "an",
  "auf",
  "aus",
  "ein",
  "mit",
  "vor",
  "zu",
  "hin",
  "her",
];

function isVowelChar(ch: string): boolean {
  return VOWEL_RE.test(ch);
}

/**
 * Zerlegt ein deutsches Wort in lesefreundliche Silben (Fibel-Silbenmethode).
 * Gibt bei kurzen/einsilbigen Wörtern oder Zahlen ein 1-Element-Array zurück.
 */
export function splitGermanWord(word: string): string[] {
  if (!word || word.length <= 3 || !/[a-zA-ZäöüÄÖÜß]/.test(word)) {
    return [word];
  }

  const lower = word.toLowerCase();

  // Finde Vokal-Kerne (inkl. Diphthonge ei, au, eu, äu, ie, ai)
  const nuclei: Array<{ start: number; end: number }> = [];
  let i = 0;
  while (i < lower.length) {
    if (isVowelChar(lower[i])) {
      const pair = lower.slice(i, i + 2);
      if (DIGRAPH_VOWELS.has(pair)) {
        nuclei.push({ start: i, end: i + 2 });
        i += 2;
      } else {
        nuclei.push({ start: i, end: i + 1 });
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  if (nuclei.length <= 1) return [word];

  const cuts: number[] = [];

  // Prüfe häufige Vorsilben am Wortanfang
  let startNucleusIdx = 0;
  for (const pref of PREFIXES) {
    if (
      lower.startsWith(pref) &&
      lower.length > pref.length + 2 &&
      nuclei[0] &&
      nuclei[0].end <= pref.length &&
      nuclei[1] &&
      nuclei[1].start >= pref.length
    ) {
      cuts.push(pref.length);
      startNucleusIdx = 1;
      break;
    }
  }

  for (let n = startNucleusIdx; n < nuclei.length - 1; n++) {
    const gapStart = nuclei[n].end;
    const gapEnd = nuclei[n + 1].start;
    const cons = lower.slice(gapStart, gapEnd);

    if (cons.length === 0) {
      cuts.push(gapStart);
      continue;
    }

    if (cons.length === 1) {
      // Ein Konsonant wandert in die nächste Silbe: Ma-ma, Le-sen
      cuts.push(gapStart);
      continue;
    }

    // Doppelkonsonanten trennen: So-nne -> Son-ne, Mut-ter
    if (cons.length === 2 && cons[0] === cons[1]) {
      cuts.push(gapStart + 1);
      continue;
    }

    // Untrennbare Konsonantenverbindungen am Anfang der Folgesilbe halten (ch, sch, ck, st, sp)
    if (cons === "sch" || cons === "ch" || cons === "ck" || cons === "ph" || cons === "th" || cons === "qu") {
      // z. B. Ma-chen, Ba-cken (für Erstleser als Einheit)
      cuts.push(gapStart);
      continue;
    }

    if (cons.endsWith("sch") && cons.length > 3) {
      cuts.push(gapEnd - 3);
      continue;
    }

    const lastTwo = cons.slice(-2);
    if (INSEPARABLE_CLUSTERS.has(lastTwo) || lastTwo === "st" || lastTwo === "sp" || lastTwo === "tr" || lastTwo === "pr" || lastTwo === "kr" || lastTwo === "gr" || lastTwo === "br" || lastTwo === "fr" || lastTwo === "dr") {
      if (cons.length > 2) {
        cuts.push(gapEnd - 2);
      } else {
        cuts.push(gapStart);
      }
      continue;
    }

    // Standard: letzter Konsonant geht in die nächste Silbe
    cuts.push(gapEnd - 1);
  }

  // Baue Silben-Strings zusammen
  const syllables: string[] = [];
  let prev = 0;
  for (const cut of cuts) {
    if (cut > prev && cut < word.length) {
      syllables.push(word.slice(prev, cut));
      prev = cut;
    }
  }
  syllables.push(word.slice(prev));
  return syllables.filter(Boolean);
}
