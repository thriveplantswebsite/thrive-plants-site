import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import Stripe from 'stripe';
import { getEnv } from '../../lib/env';
import { deliversTo, enabledMethods, isMethodId, toPence } from '../../lib/shop';
import { heldBy, hold, isSold, HOLD_SECONDS } from '../../lib/sold';

/* ============================================================
   CHECKOUT — turns a basket into a Stripe payment page.

   THE ONE RULE (from the Molly and Katherine builds): the browser sends ids
   and a delivery choice, and NOTHING ELSE is believed. Every price, the
   delivery charge and whether the item is still for sale are read here, on
   the server, from the content files and the sold store.

   THE ONE-OFF RULE (new for Thrive): before a session is created, each item
   is checked against KV. An item another buyer is mid-checkout with is
   refused, and the items in this checkout are then held for 30 minutes,
   which is how long the Stripe session lives. See src/lib/sold.ts.
   ============================================================ */

export const prerender = false;

export const POST: APIRoute = async ({ request, url, locals }) => {
  const env = getEnv(locals);

  const shop = (await getCollection('shopPage'))[0]?.data;
  if (!shop || shop.comingSoon) return json(409, { error: 'The shop is not open yet.' });

  if (!env.STRIPE_SECRET_KEY) {
    /* Explicit, because the failure everyone actually hits is a variable
       that never made it to Cloudflare, and a generic 500 would send
       someone into the basket code instead. */
    return json(500, { error: 'Payments are not set up on this site yet.' });
  }

  let body: { ids?: unknown; method?: unknown; postcode?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Could not read the basket.' });
  }

  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((x): x is string => typeof x === 'string'))] : [];
  if (!ids.length) return json(400, { error: 'Your basket is empty.' });
  if (ids.length > 30) return json(400, { error: 'That is a lot of plants. Please get in touch and we will sort it out.' });

  /* ---- delivery, from her settings ---- */
  const delivery = (await getCollection('delivery'))[0]?.data;
  const methods = delivery ? enabledMethods(delivery) : [];
  const method = methods.find((m) => isMethodId(body.method) && m.id === body.method);
  if (!method) return json(400, { error: 'Choose how you would like to get it home.' });

  const postcode = typeof body.postcode === 'string' ? body.postcode.trim() : '';
  if (method.id === 'local' && !deliversTo(postcode, delivery!.local.districts)) {
    return json(400, { error: `Sorry, we only deliver to ${delivery!.local.districts}. Collection is free.` });
  }

  /* ---- price and check everything from the content ---- */
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const unavailable: string[] = [];

  for (const id of ids) {
    const entry = await getEntry('products', id);
    if (!entry || entry.data.status !== 'available' || (await isSold(env.SOLD, id))) {
      unavailable.push(id);
      continue;
    }
    if (await heldBy(env.SOLD, id)) {
      return json(409, {
        error: `Someone is paying for “${entry.data.title}” right now. If they do not finish, it will be back within ${HOLD_SECONDS / 60} minutes.`,
      });
    }

    /* The built file's own URL rather than a resized one: this runs per
       request, and resizing only happens at build time on this host. */
    const photo = entry.data.images[0].image;
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'gbp',
        /* toPence, not a hand-rolled *100. See src/lib/shop.ts. */
        unit_amount: toPence(entry.data.price),
        product_data: {
          name: entry.data.title,
          description: entry.data.pot || undefined,
          images: [new URL(photo.src, url.origin).href],
          metadata: { id },
        },
      },
    });
  }

  if (unavailable.length) {
    return json(409, {
      error: unavailable.length === 1 ? 'One of your plants has been rehomed. It has been marked in your basket.' : 'Some of your plants have been rehomed. They have been marked in your basket.',
      sold: unavailable,
    });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,

    /* Delivery as a Stripe shipping option rather than a line item, so it
       shows as delivery on the receipt and in her dashboard. */
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: toPence(method.price), currency: 'gbp' },
          display_name: method.label,
        },
      },
    ],
    /* An address only when something is being delivered. Collection needs a
       phone number instead, so she can arrange a time. */
    ...(method.id === 'collect'
      ? { phone_number_collection: { enabled: true } }
      : { shipping_address_collection: { allowed_countries: ['GB'] }, phone_number_collection: { enabled: true } }),

    /* Stripe's minimum session life is 30 minutes, which is exactly how long
       the hold lasts. A session that outlives its hold could otherwise sell
       something that has since been sold to someone else. */
    expires_at: Math.floor(Date.now() / 1000) + HOLD_SECONDS,

    success_url: `${url.origin}/order-received?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/basket`,

    /* Read by the webhook to mark things sold, and shown in her dashboard
       next to the payment so she can see what to pack without opening each
       line. */
    metadata: {
      kind: 'shop',
      ids: ids.join(',').slice(0, 480),
      method: method.id,
      postcode: postcode.slice(0, 12),
    },
  });

  await hold(env.SOLD, ids, session.id);
  return json(200, { url: session.url });
};

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
