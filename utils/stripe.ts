import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(
    (process.env.STRIPE_SECRET_KEY || "").trim() &&
      (process.env.STRIPE_PRICE_ID_PRO || "").trim()
  );
}

export function isBillingLive(): boolean {
  const mode = (process.env.BILLING_MODE || "").trim().toLowerCase();
  if (mode === "live") return true;
  if (mode === "beta" || mode === "off") return false;
  return isStripeConfigured();
}

export function getStripe(): Stripe {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY ist nicht konfiguriert.");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      typescript: true,
    });
  }
  return stripeInstance;
}

export function getAppOrigin(req: Request): string {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
    return envUrl;
  }
  const origin = req.headers.get("origin");
  if (origin && (origin.startsWith("http://") || origin.startsWith("https://"))) {
    return origin.replace(/\/+$/, "");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) {
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}
