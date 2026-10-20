import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getEnv } from '../../lib/env';
import { markSold } from '../../lib/sold';

/* ============================================================
   STRIPE WEBHOOK — Stripe tells the site a payment has gone through.

   The only job here is marking one-off items as sold the moment they are
   paid for, without waiting for a rebuild. Receipts, refunds and "you have
   a new order" emails are Stripe's own and need nothing from this site.

   The signature check is not optional. Without it, anyone who found this
   URL could mark the whole shop as sold.
   ============================================================ */

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = getEnv(locals);
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook not configured', { status: 500 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });
  const signature = request.headers.get('stripe-signature') ?? '';
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    /* The async version with Web Crypto: the synchronous one needs Node's
       crypto module, which Workers do not have. */
    event = await stripe.webhooks.constructEventAsync(raw, signature, env.STRIPE_WEBHOOK_SECRET, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response('Bad signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.kind === 'shop' && session.payment_status === 'paid') {
      const ids = (session.metadata.ids ?? '').split(',').filter(Boolean);
      await markSold(env.SOLD, ids, session.id);
    }
  }

  /* Anything else is acknowledged and ignored, so Stripe stops retrying. */
  return new Response('ok');
};
