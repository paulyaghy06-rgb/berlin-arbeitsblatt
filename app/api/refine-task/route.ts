import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const refineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "Überarbeiteter Aufgabentext mit fettgedrucktem Operator (**Operator**)",
    },
    anforderungsbereich: {
      type: Type.STRING,
      description: "AFB I, AFB II oder AFB III",
    },
    loesung: {
      type: Type.STRING,
      description: "Aktualisierte Musterlösung für diese Aufgabe",
    },
  },
  required: ["text", "anforderungsbereich", "loesung"],
};

export async function POST(req: Request) {
  try {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY fehlt." }, { status: 500 });
    }

    const { action, taskText, currentSolution, fach, klassenstufe, titel } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    const instructionsMap: Record<string, string> = {
      easier: "Formuliere die Aufgabe sprachlich einfacher, kleinschrittiger und zugänglicher (AFB I / Basisniveau), ohne den fachlichen Kern zu verlieren.",
      harder: "Erhöhe das Anforderungsniveau deutlich (AFB III: Beurteilen, Begründen, Transfer) mit einem anspruchsvolleren Operator.",
      shorter: "Streiche unnötigen Fließtext und formuliere die Aufgabe maximal knackig, direkt und übersichtlich.",
      subtasks: "Gliedere die Aufgabe sinnvoll in 3 aufeinander aufbauende Teilaufgaben a), b) und c) mit Zeilenumbrüchen (\\n).",
      new_task: "Erstelle eine komplett neue, abwechslungsreiche Zusatzaufgabe passend zum Thema des Arbeitsblatts.",
    };

    const instruction = instructionsMap[action] || action;

    const prompt = `
Du bist ein erfahrener Fachlehrer (${fach}, ${klassenstufe}).
Thema des Arbeitsblatts: "${titel}".

AUFTRAG:
${instruction}

${taskText ? `BISHERIGE AUFGABE:\n${taskText}\n\nBISHERIGE LÖSUNG:\n${currentSolution || ""}` : ""}

REGELN:
- Setze den Operator in doppelte Sternchen (**Operator**).
- Passe die Musterlösung exakt an die neue Aufgabe an.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: refineSchema,
        temperature: 0.4,
      },
    });

    if (!response.text) {
      throw new Error("Keine Antwort erhalten.");
    }

    return NextResponse.json(JSON.parse(response.text));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fehler bei der Aufgaben-Anpassung.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
