import { createClient } from "@supabase/supabase-js";
import * as crypto from "node:crypto";
import type { Database } from "@/lib/database.types";

// Lemon Squeezy webhook. This is the ONLY writer of subscription entitlements.
// It verifies the HMAC signature, then upserts the user's subscription row via
// the service-role client (which bypasses RLS). No user can call this to grant
// themselves access — the signature check + secret gate it.

export const runtime = "nodejs"; // needs node crypto + raw body

function verifySignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Map Lemon Squeezy subscription status -> our entitlement status enum.
function mapStatus(ls: string): Database["public"]["Tables"]["subscriptions"]["Row"]["status"] {
  switch (ls) {
    case "active":
      return "active";
    case "on_trial":
      return "on_trial";
    case "paused":
      return "paused";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "none";
  }
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !serviceKey || !supabaseUrl) {
    return new Response("not configured", { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifySignature(raw, signature, secret)) {
    return new Response("bad signature", { status: 401 });
  }

  const event = JSON.parse(raw);
  const eventName: string = event?.meta?.event_name ?? "";
  const userId: string | undefined = event?.meta?.custom_data?.user_id;
  const attrs = event?.data?.attributes ?? {};

  // We only care about subscription lifecycle events.
  if (!eventName.startsWith("subscription_") || !userId) {
    return new Response("ignored", { status: 200 });
  }

  const admin = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const row = {
    user_id: userId,
    ls_subscription_id: String(event?.data?.id ?? ""),
    ls_customer_id: attrs?.customer_id ? String(attrs.customer_id) : null,
    ls_variant_id: attrs?.variant_id ? String(attrs.variant_id) : null,
    status: mapStatus(String(attrs?.status ?? "none")),
    renews_at: attrs?.renews_at ?? null,
    ends_at: attrs?.ends_at ?? null,
  };

  const { error } = await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    console.error("webhook upsert failed:", error.message);
    return new Response("db error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
