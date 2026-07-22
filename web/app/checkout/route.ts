import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// Creates a Lemon Squeezy hosted checkout for the logged-in user and redirects
// them to it. The user's Supabase id is passed in custom_data so the webhook
// can map the resulting subscription back to the right account.
export async function GET(request: Request) {
  const url = new URL(request.url);

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be logged in to buy — otherwise we can't attach the subscription.
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/checkout", url.origin));
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    // Not configured yet — send them back with a friendly note instead of 500.
    return NextResponse.redirect(new URL("/?checkout=unavailable", url.origin));
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            // Echoed back verbatim in every webhook for this subscription.
            custom: { user_id: user.id },
          },
          product_options: {
            redirect_url: `${siteUrl}/?subscribed=1`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("LS checkout failed:", res.status, body);
    return NextResponse.redirect(new URL("/?checkout=error", url.origin));
  }

  const json = await res.json();
  const checkoutUrl: string | undefined = json?.data?.attributes?.url;
  if (!checkoutUrl) {
    return NextResponse.redirect(new URL("/?checkout=error", url.origin));
  }

  return NextResponse.redirect(checkoutUrl);
}
