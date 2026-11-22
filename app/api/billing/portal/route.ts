import { NextResponse } from "next/server";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/utils/stripe";
import { getBillingSnapshot } from "@/utils/serverBilling";

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe ist noch nicht konfiguriert.", code: "STRIPE_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const snapshot = await getBillingSnapshot(req);
    if (!snapshot.authenticated || !snapshot.userId) {
      return NextResponse.json(
        { error: "Bitte melde dich zuerst an.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    if (!snapshot.stripeCustomerId) {
      return NextResponse.json(
        { error: "Kein aktives Stripe-Kundenkonto gefunden.", code: "NO_CUSTOMER" },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const origin = getAppOrigin(req);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: snapshot.stripeCustomerId,
      return_url: `${origin}/app`,
      locale: "de",
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kundenportal konnte nicht geöffnet werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
