import { Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getBillingSnapshot,
  getClientIp,
  recordUsageEvent,
} from "@/utils/serverBilling";
import {
  buildGradeDidacticsInstruction,
  buildSubjectDidacticsInstruction,
  isMathSubject,
} from "@/utils/didacticsEngine";
import {
  formatGeminiErrorWithStatus,
  generateJsonWithFallback,
  getGeminiApiKeys,
} from "@/utils/geminiModels";

export const maxDuration = 60;

const taskItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nummer: { type: Type.INTEGER },
    anforderungsbereich: { type: Type.STRING },
    typ: { type: Type.STRING },
    punkte: { type: Type.INTEGER },
    text: { type: Type.STRING },
    schreiblinien: { type: Type.INTEGER },
  },
  required: ["nummer", "anforderungsbereich", "typ", "punkte", "text", "schreiblinien"],
};

const tableSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    spalten: { type: Type.ARRAY, items: { type: Type.STRING } },
    zeilen: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
  },
};

const worksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING },
    untertitel: { type: Type.STRING },
    materialTyp: { type: Type.STRING },
    infoboxTitel: { type: Type.STRING },
    einstiegstext: { type: Type.STRING },
    schaubildSvg: { type: Type.STRING },
    tabelle: tableSchema,
    wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
    aufgaben: {
      type: Type.ARRAY,
      items: taskItemSchema,
    },
    musterloesung: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          loesung: { type: Type.STRING },
        },
        required: ["nummer", "loesung"],
      },
    },
  },
  required: ["titel", "untertitel", "materialTyp", "einstiegstext", "aufgaben", "musterloesung"],
};

const partnerWorksheetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titel: { type: Type.STRING },
    untertitel: { type: Type.STRING },
    ablaufHinweis: { type: Type.STRING },
    isPartnerarbeit: { type: Type.BOOLEAN },
    partnerModus: { type: Type.STRING },
    materialTyp: { type: Type.STRING },
    infoboxTitel: { type: Type.STRING },
    einstiegstext: { type: Type.STRING },
    tabelle: tableSchema,
    wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
    aufgaben: {
      type: Type.ARRAY,
      items: taskItemSchema,
    },
    partnerB: {
      type: Type.OBJECT,
      properties: {
        untertitel: { type: Type.STRING },
        materialTyp: { type: Type.STRING },
        infoboxTitel: { type: Type.STRING },
        einstiegstext: { type: Type.STRING },
        tabelle: tableSchema,
        wortliste: { type: Type.ARRAY, items: { type: Type.STRING } },
        aufgaben: {
          type: Type.ARRAY,
          items: taskItemSchema,
        },
      },
      required: ["untertitel", "materialTyp", "infoboxTitel", "einstiegstext", "aufgaben"],
    },
    musterloesung: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nummer: { type: Type.INTEGER },
          loesung: { type: Type.STRING },
        },
        required: ["nummer", "loesung"],
      },
    },
  },
  required: [
    "titel",
    "untertitel",
    "ablaufHinweis",
    "materialTyp",
    "infoboxTitel",
    "einstiegstext",
    "aufgaben",
    "partnerB",
    "musterloesung",
  ],
};

function normalizeTasks(aufgaben: unknown): unknown {
  if (!Array.isArray(aufgaben)) return aufgaben;
  return aufgaben.map((a: Record<string, unknown>, idx: number) => {
    const typLower = String(a.typ || "").toLowerCase();
    const isNoLines = typLower.includes("multiple") || typLower.includes("lückentext");
    return {
      ...a,
      nummer: idx + 1,
      ...(isNoLines ? { schreiblinien: 0 } : {}),
    };
  });
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`edit:${ip}`, 30, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Zu viele Anfragen in kurzer Zeit. Bitte warte einen kurzen Moment.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    const billing = await getBillingSnapshot(req);
    if (
      billing.billingLive &&
      billing.plan !== "pro" &&
      billing.usage.refinesLimit !== null &&
      billing.usage.refinesUsed >= billing.usage.refinesLimit
    ) {
      return NextResponse.json(
        {
          error: billing.authenticated
            ? `Du hast dein monatliches Kontingent von ${billing.usage.refinesLimit} kostenlosen KI-Anpassungen erreicht. Mit LehrReich Pro kannst du unbegrenzt verfeinern.`
            : `Du hast deine ${billing.usage.refinesLimit} kostenlosen Test-Anpassungen verbraucht. Melde dich kostenlos an oder wechsle auf LehrReich Pro.`,
          code: "LIMIT_REACHED",
          authenticated: billing.authenticated,
          used: billing.usage.refinesUsed,
          limit: billing.usage.refinesLimit,
        },
        { status: 402 }
      );
    }

    if (getGeminiApiKeys().length === 0) {
      return NextResponse.json({ error: "GEMINI_API_KEY fehlt." }, { status: 500 });
    }

    const { worksheet, instruction, fach, klassenstufe } = await req.json();
    if (!worksheet || !instruction?.trim()) {
      return NextResponse.json({ error: "Arbeitsblatt oder Änderungsanweisung fehlt." }, { status: 400 });
    }

    const isPartner = Boolean(worksheet.isPartnerarbeit && worksheet.partnerB);
    const isMath = isMathSubject(fach || "");
    const gradeProfile = buildGradeDidacticsInstruction(klassenstufe || "Klasse 7", "");
    const subjectProfile = buildSubjectDidacticsInstruction(
      fach || "",
      klassenstufe || "Klasse 7",
      isMath
    );

    const prompt = [
      "Du bist ein erfahrener Fachlehrer und Didaktik-Experte.",
      isPartner
        ? "Überarbeite das bestehende 2-Seiten-Partnerarbeit-Set (Blatt A UND partnerB) gezielt gemäß der Anweisung der Lehrkraft."
        : "Überarbeite das bestehende Arbeitsblatt (JSON) gezielt gemäß der Anweisung der Lehrkraft.",
      "",
      gradeProfile,
      subjectProfile,
      "",
      "ANWEISUNG DER LEHRKRAFT:",
      instruction.trim(),
      "",
      "REGELN FÜR DIE ÜBERARBEITUNG:",
      "1. Ändere NUR die Teile, die von der Anweisung betroffen sind – bewahre alle übrigen Aufgaben, Texte und Strukturen unverändert!",
      isPartner
        ? "2. WICHTIG PARTNERARBEIT: Bewahre sowohl Blatt A als auch partnerB (Seite 2) und ablaufHinweis vollständig und komplementär!"
        : "",
      "3. Formuliere Aufgabenstellungen klar, kurz und schülergerecht für " + (klassenstufe || "die Klasse") + " (" + (fach || "Unterricht") + ").",
      "4. Setze Operatoren in doppelte Sternchen (**Operator**).",
      "5. Nummeriere aufgaben und musterloesung sauber von 1 bis N durch und halte musterloesung synchron mit aufgaben.",
      "6. Bei Multiple-Choice- oder Lückentext-Aufgaben gilt immer schreiblinien: 0.",
      "",
      "AKTUELLES ARBEITSBLATT (JSON):",
      JSON.stringify(worksheet),
    ]
      .filter(Boolean)
      .join("\n");

    const { data: parsed } = await generateJsonWithFallback<Record<string, unknown>>({
      mode: "fast",
      parts: [{ text: prompt }],
      responseSchema: isPartner ? partnerWorksheetSchema : worksheetSchema,
      temperature: isMath ? 0.25 : 0.3,
      maxOutputTokens: 8192,
      totalBudgetMs: 46_000,
    });

    parsed.aufgaben = normalizeTasks(parsed.aufgaben as Array<Record<string, unknown>> | undefined);
    if (isPartner) {
      parsed.isPartnerarbeit = true;
      parsed.partnerModus = worksheet.partnerModus || parsed.partnerModus || "tandem";
      if (parsed.partnerB && typeof parsed.partnerB === "object") {
        const pb = parsed.partnerB as Record<string, unknown>;
        pb.aufgaben = normalizeTasks(pb.aufgaben as Array<Record<string, unknown>> | undefined);
      }
    }
    const { setCookieHeader } = await recordUsageEvent(req, billing.userId, "edit");
    return NextResponse.json(parsed, {
      headers: { "Set-Cookie": setCookieHeader },
    });
  } catch (error) {
    const { message, status, retryable } = formatGeminiErrorWithStatus(
      error,
      "Fehler beim Anpassen des Blatts"
    );
    return NextResponse.json({ error: message, retryable }, { status });
  }
}
