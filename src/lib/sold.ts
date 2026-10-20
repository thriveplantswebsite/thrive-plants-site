import type { KVLike } from './env';

/* ============================================================
   SOLD AND HELD — what stops two people buying the same one-off pot.

   On the Molly build an item only shows as sold once she marks it in the CMS
   and the site rebuilds, which is fine for prints that come in editions. For
   Mandie every item is a one-off, so the gap between a sale and that rebuild
   is a window in which someone else can buy the same pot.

   So sales are recorded in Cloudflare KV, a small key-value store that
   needs no rebuild:

   - `held:<id>` is written when a checkout starts, with a 30 minute expiry
     to match the Stripe session. While it exists, nobody else can start a
     checkout for that item. If the buyer gives up, it simply expires.
   - `sold:<id>` is written by the Stripe webhook once payment succeeds, and
     never expires. The checkout checks it before taking payment.
   - `sold-index` is one record holding the list of every sold id. The shop
     reads it on page load. It is a single READ rather than a LIST of the
     `sold:` keys on purpose: KV's free plan allows 100,000 reads a day but
     only 1,000 lists, and one list per shop visit would run out on a good
     day. The `sold:<id>` keys stay as the per-item record of what sold when.

   KV's free allowance is 1,000 writes a day, which is a few hundred sales.

   If KV is not configured (local dev without wrangler, or a host without
   it), everything here quietly does nothing and the shop behaves like the
   Molly build: sold by hand in the CMS.
   ============================================================ */

export const HOLD_SECONDS = 30 * 60;

export async function isSold(kv: KVLike | undefined, id: string): Promise<boolean> {
  if (!kv) return false;
  return (await kv.get(`sold:${id}`)) !== null;
}

/** The session holding this item, if someone else is mid-checkout. */
export async function heldBy(kv: KVLike | undefined, id: string): Promise<string | null> {
  if (!kv) return null;
  return kv.get(`held:${id}`);
}

export async function hold(kv: KVLike | undefined, ids: string[], session: string): Promise<void> {
  if (!kv) return;
  await Promise.all(ids.map((id) => kv.put(`held:${id}`, session, { expirationTtl: HOLD_SECONDS })));
}

const INDEX = 'sold-index';

export async function markSold(kv: KVLike | undefined, ids: string[], session: string): Promise<void> {
  if (!kv) return;
  const when = new Date().toISOString();
  await Promise.all(ids.map((id) => kv.put(`sold:${id}`, JSON.stringify({ session, when }))));
  /* Read, merge, write. Two webhooks landing in the same instant could each
     miss the other's ids here; the per-item `sold:` keys above are still
     written, and isSold() checks those, so the checkout stays safe even if
     the index briefly lags. */
  const current = await soldIds(kv);
  await kv.put(INDEX, JSON.stringify([...new Set([...current, ...ids])]));
}

export async function soldIds(kv: KVLike | undefined): Promise<string[]> {
  if (!kv) return [];
  try {
    const parsed: unknown = JSON.parse((await kv.get(INDEX)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
