import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/utils/stripe";
import { getSupabaseAdmin } from "@/utils/serverBilling";

function extractPeriodEndIso(sub: Stripe.Subscription): string | null {
  const firstItemEnd = sub.items?.data?.[0]?.current_period_end;
  const legacyEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const unixTs = typeof firstItemEnd === "number" ? firstItemEnd : legacyEnd;
  if (!unixTs) return null;
  return new Date(unixTs * 1000).toISOString();
}

async function resolveUserIdFromCustomer(
  customerId: string | null,
  metadataUserId?: string | null
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;
  const admin = getSupabaseAdmin();
  if (!admin || !customerId) return null;

  const { data } = await admin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.user_id || null;
}

async function syncSubscriptionToSupabase(sub: Stripe.Subscription) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id || null;
  const userId = await resolveUserIdFromCustomer(
    customerId,
    sub.metadata?.supabase_user_id || null
  );

  if (!userId) return;

  const isProStatus = sub.status === "active" || sub.status === "trialing";
  await admin.from("user_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan: isProStatus ? "pro" : "free",
      status: sub.status,
      current_period_end: extractPeriodEndIso(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function POST(req: Request) {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Stripe-Signatur fehlt." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ungültige Webhook-Signatur.";
    return NextResponse.json({ error: `Webhook-Fehler: ${msg}` }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const admin = getSupabaseAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;
        const userId = await resolveUserIdFromCustomer(
          customerId,
          session.metadata?.supabase_user_id || null
        );

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          if (userId && !sub.metadata?.supabase_user_id) {
            await stripe.subscriptions.update(subscriptionId, {
              metadata: { supabase_user_id: userId },
            });
          }
          await syncSubscriptionToSupabase({
            ...sub,
            metadata: { ...sub.metadata, ...(userId ? { supabase_user_id: userId } : {}) },
          });
        } else if (admin && userId) {
          await admin.from("user_subscriptions").upsert(
            {
              user_id: userId,
              email: session.customer_details?.email || null,
              stripe_customer_id: customerId,
              plan: "pro",
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionToSupabase(sub);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id || null;
        if (admin && customerId) {
          await admin
            .from("user_subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook-Verarbeitung fehlgeschlagen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
