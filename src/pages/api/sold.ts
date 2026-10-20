import type { APIRoute } from 'astro';
import { getEnv } from '../../lib/env';
import { soldIds } from '../../lib/sold';

/* What has sold since the site was last built. Read by the shop, item and
   basket pages on load: one KV read per visit (see src/lib/sold.ts for why
   it is a read and not a list). The browser may reuse the answer for 30
   seconds; the checkout checks every item again regardless, so a stale
   answer can only ever show something as available, never sell it twice. */
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const sold = await soldIds(getEnv(locals).SOLD).catch(() => []);
  return new Response(JSON.stringify({ sold }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
};
