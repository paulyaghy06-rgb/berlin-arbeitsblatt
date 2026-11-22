import { NextResponse } from "next/server";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/utils/stripe";
import { getBillingSnapshot, getSupabaseAdmin } from "@/utils/serverBilling";

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY oder STRIPE_PRICE_ID_PRO fehlt).",
          code: "STRIPE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const snapshot = await getBillingSnapshot(req);
    if (!snapshot.authenticated || !snapshot.userId) {
      return NextResponse.json(
        { error: "Bitte melde dich zuerst an, um LehrReich Pro zu buchen.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    if (snapshot.plan === "pro") {
      return NextResponse.json(
        { error: "Dein LehrReich Pro-Abo ist bereits aktiv.", code: "ALREADY_PRO" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const priceId = (process.env.STRIPE_PRICE_ID_PRO || "").trim();
    const origin = getAppOrigin(req);

    let customerId = snapshot.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: snapshot.email || undefined,
        metadata: {
          supabase_user_id: snapshot.userId,
        },
      });
      customerId = customer.id;

      const admin = getSupabaseAdmin();
      if (admin) {
        await admin.from("user_subscriptions").upsert(
          {
            user_id: snapshot.userId,
            email: snapshot.email,
            stripe_customer_id: customerId,
            plan: "free",
            status: "inactive",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      locale: "de",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          supabase_user_id: snapshot.userId,
        },
      },
      metadata: {
        supabase_user_id: snapshot.userId,
      },
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/app?checkout=cancel`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe Checkout-Session konnte nicht erstellt werden." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fehler beim Starten des Stripe-Checkouts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
