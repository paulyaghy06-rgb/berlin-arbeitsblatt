import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getAuthenticatedUser,
  getClientIp,
  getSupabaseAdmin,
} from "@/utils/serverBilling";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`redeem:${ip}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Zu viele Versuche. Bitte warte ein paar Minuten und versuche es erneut." },
        { status: 429 }
      );
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        {
          error: "Bitte melde dich zuerst kostenlos an, um deinen Gutschein-Code deinem Konto gutzuschreiben.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Supabase Service Role Key fehlt in den Server-Einstellungen." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { code?: string };
    const normalized = String(body.code || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (!normalized || normalized.length < 4 || normalized.length > 40) {
      return NextResponse.json(
        { error: "Bitte gib einen gültigen Gutschein-Code ein (z. B. LR-XXXX-XXXX)." },
        { status: 400 }
      );
    }

    const { data: promo, error: promoErr } = await admin
      .from("promo_codes")
      .select("code, label, duration_days, max_uses, used_count, active, expires_at")
      .eq("code", normalized)
      .maybeSingle();

    if (promoErr) {
      return NextResponse.json(
        {
          error:
            "Gutschein-Tabelle ist in Supabase noch nicht eingerichtet (bitte Migration 2026_promo_codes.sql ausführen).",
        },
        { status: 500 }
      );
    }

    if (!promo || !promo.active) {
      return NextResponse.json(
        { error: "Dieser Gutschein-Code ist ungültig oder nicht mehr aktiv." },
        { status: 404 }
      );
    }

    if (promo.expires_at && Date.parse(promo.expires_at) < Date.now()) {
      return NextResponse.json(
        { error: "Dieser Gutschein-Code ist leider bereits abgelaufen." },
        { status: 400 }
      );
    }

    if (promo.used_count >= promo.max_uses) {
      return NextResponse.json(
        { error: "Dieser Gutschein-Code wurde bereits eingelöst." },
        { status: 409 }
      );
    }

    // Prüfen, ob dieser Nutzer genau diesen Code schon eingelöst hat
    const { data: existingRedemption } = await admin
      .from("promo_redemptions")
      .select("id")
      .eq("code", normalized)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRedemption) {
      return NextResponse.json(
        { error: "Du hast diesen Gutschein-Code bereits auf deinem Konto eingelöst." },
        { status: 409 }
      );
    }

    // Optimistisches atomares Hochzählen von used_count (verhindert Race Conditions bei 1x-Codes)
    const { data: updatedRows, error: incErr } = await admin
      .from("promo_codes")
      .update({ used_count: promo.used_count + 1 })
      .eq("code", normalized)
      .eq("used_count", promo.used_count)
      .select("code");

    if (incErr || !updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Dieser Gutschein-Code wurde gerade eben bereits eingelöst." },
        { status: 409 }
      );
    }

    await admin.from("promo_redemptions").insert({
      code: normalized,
      user_id: user.id,
    });

    // Bestehende Laufzeit ggf. verlängern, sonst ab jetzt + duration_days
    const { data: currentSub } = await admin
      .from("user_subscriptions")
      .select("plan, status, current_period_end, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const nowMs = Date.now();
    const existingEndMs = currentSub?.current_period_end
      ? Date.parse(currentSub.current_period_end)
      : 0;
    const baseMs = existingEndMs > nowMs ? existingEndMs : nowMs;
    const durationDays = Math.max(1, Number(promo.duration_days) || 30);
    const newPeriodEnd = new Date(baseMs + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { error: subErr } = await admin.from("user_subscriptions").upsert(
      {
        user_id: user.id,
        email: user.email,
        plan: "pro",
        status: currentSub?.stripe_subscription_id ? currentSub.status : "promo",
        current_period_end: newPeriodEnd,
        cancel_at_period_end: currentSub?.stripe_subscription_id ? false : true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subErr) {
      return NextResponse.json(
        { error: "Freischaltung konnte nicht gespeichert werden. Bitte melde dich kurz beim Support." },
        { status: 500 }
      );
    }

    const formattedDate = new Date(newPeriodEnd).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return NextResponse.json({
      ok: true,
      durationDays,
      currentPeriodEnd: newPeriodEnd,
      message: `Geschafft! LehrReich Pro ist jetzt ${durationDays} Tage bis zum ${formattedDate} kostenlos für dich freigeschaltet (kein Abo).`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Einlösen des Codes." },
      { status: 500 }
    );
  }
}
