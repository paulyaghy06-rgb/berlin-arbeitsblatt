import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isBillingLive, isStripeConfigured } from "./stripe";

export const FREE_MONTHLY_GENERATIONS = 5;
export const ANON_MONTHLY_GENERATIONS = 2;
export const FREE_MONTHLY_REFINES = 15;
export const ANON_MONTHLY_REFINES = 6;

export type UsageAction = "generate" | "refine" | "edit";

export type BillingSnapshot = {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  plan: "free" | "pro";
  status: string;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    monthKey: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    refinesUsed: number;
    refinesLimit: number | null;
  };
  stripeConfigured: boolean;
  billingLive: boolean;
};

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url.startsWith("http") || !serviceKey) return null;
  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

function getSupabaseAnon(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url.startsWith("http") || !anonKey) return null;
  if (!anonClient) {
    anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getSigningSecret(): string {
  return (
    process.env.USAGE_COOKIE_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GEMINI_API_KEY ||
    "lehrreich-local-dev-secret"
  );
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashAnonKey(req: Request): string {
  const ip = getClientIp(req);
  const ua = (req.headers.get("user-agent") || "").slice(0, 80);
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(`${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32);
}

// ============================================================
// IN-MEMORY SLIDING-WINDOW RATE LIMITER (ABUSE PROTECTION)
// ============================================================
type RateBucket = { timestamps: number[] };
const rateStore = new Map<string, RateBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = rateStore.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateStore.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  rateStore.set(key, bucket);

  // Periodic cleanup to keep memory bounded
  if (rateStore.size > 2000) {
    for (const [k, v] of rateStore.entries()) {
      if (v.timestamps.length === 0 || v.timestamps[v.timestamps.length - 1] < cutoff) {
        rateStore.delete(k);
      }
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}

// ============================================================
// SIGNED COOKIE FALLBACK FOR USAGE WHEN SERVICE ROLE NOT SET
// ============================================================
const USAGE_COOKIE_NAME = "lr_usage_v1";

type CookieUsagePayload = {
  m: string; // monthKey
  g: number; // generate count
  r: number; // refine/edit count
};

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function readUsageCookie(req: Request, monthKey: string): CookieUsagePayload {
  try {
    const cookies = parseCookieHeader(req.headers.get("cookie"));
    const raw = cookies[USAGE_COOKIE_NAME];
    if (!raw) return { m: monthKey, g: 0, r: 0 };
    const [b64, sig] = raw.split(".");
    if (!b64 || !sig) return { m: monthKey, g: 0, r: 0 };
    const expected = crypto
      .createHmac("sha256", getSigningSecret())
      .update(b64)
      .digest("base64url");
    if (sig !== expected) return { m: monthKey, g: 0, r: 0 };
    const parsed = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as CookieUsagePayload;
    if (parsed.m !== monthKey) return { m: monthKey, g: 0, r: 0 };
    return {
      m: monthKey,
      g: Math.max(0, Number(parsed.g) || 0),
      r: Math.max(0, Number(parsed.r) || 0),
    };
  } catch {
    return { m: monthKey, g: 0, r: 0 };
  }
}

export function buildUsageSetCookieHeader(payload: CookieUsagePayload): string {
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(b64)
    .digest("base64url");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${USAGE_COOKIE_NAME}=${encodeURIComponent(`${b64}.${sig}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2764800${secure}`;
}

// ============================================================
// SUPABASE JWT AUTHENTICATION & SUBSCRIPTION LOOKUP
// ============================================================
export async function getAuthenticatedUser(
  req: Request
): Promise<{ id: string; email: string | null } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return null;

  const client = getSupabaseAdmin() || getSupabaseAnon();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

async function fetchSubscriptionRow(userId: string): Promise<{
  plan: "free" | "pro";
  status: string;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      plan: "free",
      status: "inactive",
      stripeCustomerId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  try {
    const { data, error } = await admin
      .from("user_subscriptions")
      .select("plan, status, stripe_customer_id, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return {
        plan: "free",
        status: "inactive",
        stripeCustomerId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const isActivePro =
      data.plan === "pro" && (data.status === "active" || data.status === "trialing");

    return {
      plan: isActivePro ? "pro" : "free",
      status: data.status || "inactive",
      stripeCustomerId: data.stripe_customer_id || null,
      currentPeriodEnd: data.current_period_end || null,
      cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    };
  } catch {
    return {
      plan: "free",
      status: "inactive",
      stripeCustomerId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
}

async function countMonthlyUsage(
  req: Request,
  userId: string | null,
  monthKey: string
): Promise<{ generateCount: number; refineCount: number }> {
  const cookieUsage = readUsageCookie(req, monthKey);
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { generateCount: cookieUsage.g, refineCount: cookieUsage.r };
  }

  try {
    const anonKey = hashAnonKey(req);
    const filterCol = userId ? "user_id" : "anon_key";
    const filterVal = userId || anonKey;

    const { data, error } = await admin
      .from("usage_events")
      .select("action")
      .eq(filterCol, filterVal)
      .eq("month_key", monthKey);

    if (error || !data) {
      return { generateCount: cookieUsage.g, refineCount: cookieUsage.r };
    }

    let dbGen = 0;
    let dbRef = 0;
    for (const row of data) {
      if (row.action === "generate") dbGen += 1;
      else dbRef += 1;
    }

    return {
      generateCount: Math.max(dbGen, userId ? 0 : cookieUsage.g),
      refineCount: Math.max(dbRef, userId ? 0 : cookieUsage.r),
    };
  } catch {
    return { generateCount: cookieUsage.g, refineCount: cookieUsage.r };
  }
}

export async function getBillingSnapshot(req: Request): Promise<BillingSnapshot> {
  const monthKey = getCurrentMonthKey();
  const user = await getAuthenticatedUser(req);
  const billingLive = isBillingLive();
  const stripeConfigured = isStripeConfigured();

  const sub = user
    ? await fetchSubscriptionRow(user.id)
    : {
        plan: "free" as const,
        status: "inactive",
        stripeCustomerId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };

  const { generateCount, refineCount } = await countMonthlyUsage(
    req,
    user?.id ?? null,
    monthKey
  );

  const isPro = sub.plan === "pro";
  const genLimit = isPro
    ? null
    : user
    ? FREE_MONTHLY_GENERATIONS
    : ANON_MONTHLY_GENERATIONS;
  const refLimit = isPro
    ? null
    : user
    ? FREE_MONTHLY_REFINES
    : ANON_MONTHLY_REFINES;

  return {
    authenticated: Boolean(user),
    userId: user?.id ?? null,
    email: user?.email ?? null,
    plan: sub.plan,
    status: sub.status,
    stripeCustomerId: sub.stripeCustomerId,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    usage: {
      monthKey,
      used: generateCount,
      limit: genLimit,
      remaining: genLimit === null ? null : Math.max(0, genLimit - generateCount),
      refinesUsed: refineCount,
      refinesLimit: refLimit,
    },
    stripeConfigured,
    billingLive,
  };
}

export async function recordUsageEvent(
  req: Request,
  userId: string | null,
  action: UsageAction
): Promise<{ setCookieHeader: string }> {
  const monthKey = getCurrentMonthKey();
  const cookieUsage = readUsageCookie(req, monthKey);
  const nextCookie: CookieUsagePayload = {
    m: monthKey,
    g: cookieUsage.g + (action === "generate" ? 1 : 0),
    r: cookieUsage.r + (action === "generate" ? 0 : 1),
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin.from("usage_events").insert({
        user_id: userId,
        anon_key: userId ? null : hashAnonKey(req),
        action,
        month_key: monthKey,
      });
    } catch {
      // Fallback cookie still tracks usage if table wasn't migrated yet
    }
  }

  return { setCookieHeader: buildUsageSetCookieHeader(nextCookie) };
}
