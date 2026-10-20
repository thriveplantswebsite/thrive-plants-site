import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import Stripe from 'stripe';
import { getEnv } from '../../lib/env';
import { toPence } from '../../lib/shop';

/* ============================================================
   GIFT VOUCHERS — a payment, then Mandie sends the voucher by hand.

   Deliberately the simple version. Stripe takes the money and emails the
   buyer a receipt; Mandie gets Stripe's "new payment" email with the
   recipient's name and message in it, and sends the voucher herself (or
   Katherine's design, once it exists). Automatic voucher codes would need a
   store of codes, a way to redeem them and a way to check them at drop-off,
   which is a lot of machinery for a handful of vouchers a month. Worth
   building only if they sell well enough to need it.

   As at the checkout, the amount is never taken from the browser: it has to
   be one of the amounts she has listed in the CMS.
   ============================================================ */

export const prerender = false;

export const POST: APIRoute = async ({ request, url, locals }) => {
  const env = getEnv(locals);
  if (!env.STRIPE_SECRET_KEY) return json(500, { error: 'Payments are not set up on this site yet.' });

  let body: { amount?: unknown; recipient?: unknown; message?: unknown; from?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Could not read that. Please try again.' });
  }

  const page = (await getCollection('vouchersPage'))[0]?.data;
  const amount = Number(body.amount);
  if (!page || !page.amounts.includes(amount)) return json(400, { error: 'Choose one of the voucher amounts.' });

  const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const recipient = clean(body.recipient, 80);
  const from = clean(body.from, 80);
  const message = clean(body.message, 400);
  if (!recipient) return json(400, { error: 'Who is the voucher for?' });

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: toPence(amount),
          product_data: { name: `Plant care gift voucher, £${amount}`, description: `For ${recipient}` },
        },
      },
    ],
    /* Stripe lists custom fields and metadata on the payment, which is where
       she will read who to make the voucher out to. */
    metadata: { kind: 'voucher', recipient, from, message: message.slice(0, 480) },
    payment_intent_data: { description: `Gift voucher £${amount} for ${recipient}` },
    success_url: `${url.origin}/order-received?type=voucher&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/vouchers`,
  });

  return json(200, { url: session.url });
};

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
