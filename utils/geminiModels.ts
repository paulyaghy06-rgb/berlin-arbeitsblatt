// Zentrale Gemini-Modell-Konfiguration (keine veralteten 2.5-Modelle mehr!)
// Abgestimmt auf aktuelle Google AI Studio Quotas:
// - gemini-3.5-flash-lite: 15 RPM / 500 RPD
// - gemini-3.1-flash-lite: 15 RPM / 500 RPD
// - gemini-3.8-flash:       5 RPM /  20 RPD (höchste Qualität für Erstentwürfe)
// - gemini-3.6-flash:       5 RPM /  20 RPD

function parseEnvModels(): string[] | null {
  const raw = (process.env.GEMINI_MODELS || "").trim();
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

/**
 * Für komplette Arbeitsblatt-, Klassenarbeit- & Partnerarbeit-Generierung:
 * Nutzt zuerst die stärksten Flash-Modelle und fällt bei Limit nahtlos auf
 * die High-Volume Flash-Lite-Modelle (zusammen 1.000+ Anfragen/Tag) zurück.
 */
export function getGenerateModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ]
  );
}

/**
 * Für schnelle Folgeaktionen (Einzelaufgabe anpassen, KI-Feinschliff,
 * Tipp-Karten & Stundenverlauf): schont das 20/Tag-Kontingent von 3.8/3.6 Flash.
 */
export function getFastModels(): string[] {
  return (
    parseEnvModels() || [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.6-flash",
    ]
  );
}

/**
 * Wandelt rohe Google-API-Fehler in eine verständliche deutsche Meldung um.
 */
export function formatGeminiError(error: unknown, fallbackMsg: string): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  if (raw.includes("429") || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return "Die KI ist gerade kurz ausgelastet (Anfragelimit erreicht). Bitte versuche es in 15–30 Sekunden erneut.";
  }
  if (raw.includes("503") || /UNAVAILABLE|overloaded/i.test(raw)) {
    return "Der KI-Dienst ist momentan kurz überlastet. Bitte klicke gleich noch einmal auf Generieren.";
  }
  if (raw.includes("401") || raw.includes("403") || /API_KEY_INVALID|PERMISSION_DENIED/i.test(raw)) {
    return "API-Schlüssel-Fehler bei Gemini. Bitte prüfe GEMINI_API_KEY in den Einstellungen.";
  }
  return raw ? `${fallbackMsg}: ${raw.slice(0, 220)}` : fallbackMsg;
}
