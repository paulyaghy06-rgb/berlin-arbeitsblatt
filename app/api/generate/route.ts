import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const {
      modus,
      fach,
      schulform,
      klassenstufe,
      thema,
      freiesThema,
      eigenerText,
      niveau,
      aufgabentypen,
      dauer,
      zusatzwuensche,
    } = await req.json();

    const ausgewaehlteTypen =
      aufgabentypen && aufgabentypen.length > 0
        ? aufgabentypen.join(", ")
        : "Offene Verständnis- & Analysefragen (AFB I–III)";

    const systemInstruction = `
Du bist ein erfahrener Berliner Fachleiter und Didaktik-Experte für die Sekundarstufe I & II.
Erstelle ein sofort druckfertiges, didaktisch exzellentes Arbeitsblatt für das Fach "${fach}".

WICHTIGE REGELN:
1. Nutze zwingend die offiziellen Berliner Operatoren (z.B. **Nenne**, **Beschreibe**, **Erläutere**, **Analysiere**, **Beurteile**, **Diskutiere**) und setze sie immer in doppelte Sternchen (**Operator**).
2. Passe Sprachniveau, Komplexität und Hilfestellungen strikt an: "${niveau}".
3. Berücksichtige den gewünschten Umfang: "${dauer}".
4. Integriere gezielt diese gewünschten Aufgabentypen: ${ausgewaehlteTypen}.
   - Falls "Lückentext" gewählt wurde, erstelle eine Aufgabe mit klaren Lücken (_____) und liste die einzusetzenden Begriffe in Klammern [Wortbank: ...] darunter auf.
   - Falls "Multiple-Choice" gewählt wurde, gib die Optionen a), b), c), d) direkt im Aufgabentext an.
5. Falls "DaZ" gewählt wurde oder Begriffe sehr komplex sind, fülle "wortliste" mit 4–6 Worterklärungen (sonst []).
6. Falls ein eigener Ausgangstext vorgegeben wurde, nutze diesen als Grundlage (kürze oder vereinfache ihn nur, wenn das Niveau "Basis" oder "DaZ" dies erfordert). Falls kein Text vorgegeben wurde, verfasse einen packenden, fachlich korrekten Quellentext oder Darstellungstext (180–280 Wörter).
7. Gib das Ergebnis AUSSCHLIESSLICH als valides JSON in dieser Struktur zurück:
{
  "titel": "Prägnanter Titel des Arbeitsblatts",
  "untertitel": "Fach & Themenfeld",
  "einstiegstext": "Ausgangstext / Materialgrundlage",
  "wortliste": ["Fachbegriff: Einfache Erklärung"],
  "aufgaben": [
    {
      "nummer": 1,
      "anforderungsbereich": "AFB I",
      "typ": "Verständnis",
      "text": "**Nenne** anhand des Materials...",
      "schreiblinien": 3
    }
  ],
  "musterloesung": [
    {
      "nummer": 1,
      "loesung": "Ausführlicher Erwartungshorizont / Musterlösung..."
    }
  ]
}
`;

    const contextBlock =
      modus === "rlp"
        ? `- Modus: Nach Berliner Rahmenlehrplan (RLP)\n- Themenfeld: ${thema}`
        : `- Modus: Freies Thema / Eigenes Material\n- Thema/Fokus: ${freiesThema || "Aus dem vorgegebenen Text ableiten"}\n- Vorgegebener Ausgangstext:\n"""\n${eigenerText || "Kein Text vorgegeben – bitte passenden Materialtext erstellen."}\n"""`;

    const prompt = `Erstelle ein Arbeitsblatt mit diesen Vorgaben:
- Bundesland: Berlin
- Fach: ${fach}
- Schulform: ${schulform}
- Klassenstufe: ${klassenstufe}
${contextBlock}
- Niveau/Differenzierung: ${niveau}
- Umfang: ${dauer}
- Gewünschte Aufgabentypen: ${ausgewaehlteTypen}
${zusatzwuensche ? `- Besondere Wünsche der Lehrkraft: ${zusatzwuensche}` : ""}`;

    const models = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.8-flash",
    ];
    let content: string | undefined;
    let lastError: unknown;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        });
        content = response.text;
        if (content) break;
      } catch (err) {
        lastError = err;
        console.warn(`Modell ${model} kurz ausgelastet, wechsle...`);
        await sleep(1500);
      }
    }

    if (!content) throw lastError || new Error("Keine Antwort von Gemini erhalten.");

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error("Fehler bei Gemini-Generierung:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Arbeitsblatts" },
      { status: 500 }
    );
  }
}
