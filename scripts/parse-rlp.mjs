import fs from "fs";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

// Aufruf: GEMINI_API_KEY="dein_key" node scripts/parse-rlp.mjs pfad/zum/lehrplan.pdf "Geschichte"
const [, , pdfPath, fachName] = process.argv;

if (!pdfPath || !fachName) {
  console.error('Verwendung: GEMINI_API_KEY="..." node scripts/parse-rlp.mjs <pfad-zur-pdf> "<Fachname>"');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const base64Pdf = fs.readFileSync(path.resolve(pdfPath)).toString("base64");

const schema = {
  type: Type.OBJECT,
  properties: {
    fach: { type: Type.STRING },
    themenNachKlasse: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          klasse: { type: Type.STRING, description: "Einzelne Klassenstufe als Zahl, z.B. '5', '6', '7', '8', '9', '10', '11', '12'" },
          themenfelder: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Konkrete offizielle Themenfelder für diese Klassenstufe",
          },
        },
        required: ["klasse", "themenfelder"],
      },
    },
  },
  required: ["fach", "themenNachKlasse"],
};

async function run() {
  console.log(`Analysiere Lehrplan-PDF für ${fachName}...`);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
          {
            text: `Extrahiere aus diesem offiziellen Lehrplan für das Fach "${fachName}" alle verbindlichen Themenfelder und ordne sie exakten einzelnen Klassenstufen ('1' bis '13') zu. Falls der Lehrplan Doppeljahrgangsstufen (z.B. 5/6) nennt, verteile die Themenfelder sinnvoll auf die einzelnen Klassenstufen '5' und '6'.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
    },
  });

  const outFile = `data/parsed-${fachName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`;
  fs.writeFileSync(outFile, response.text, "utf-8");
  console.log(`Fertig! Gespeichert unter: ${outFile}`);
}

run().catch(console.error);
