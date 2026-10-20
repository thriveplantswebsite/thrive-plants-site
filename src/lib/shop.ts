/* ============================================================
   SHOP RULES — the single place that decides money and delivery.

   The basket page and the checkout endpoint both import from here. They must
   never disagree: a basket that quotes £5 delivery and a Stripe page that
   then charges £12 is worse than not quoting at all.

   MONEY IS IN POUNDS in the content files, because that is what Mandie
   types. It is converted to pence exactly once, here, at the Stripe
   boundary. (Carried over from the Molly build, which found the scaffold
   saying "pence" in one file and "pounds" in another: the first real charge
   would have been 100x out.)
   ============================================================ */

/** Content and CMS hold pounds. Stripe takes pence. Convert exactly once. */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100);
}

/** £24, not £24.00. £24.50 stays as it is. */
export function formatPrice(pounds: number): string {
  return Number.isInteger(pounds)
    ? `£${pounds.toLocaleString('en-GB')}`
    : `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ---------- delivery ---------- */

export type MethodId = 'collect' | 'local' | 'courier';
export const METHOD_IDS: MethodId[] = ['collect', 'local', 'courier'];

export function isMethodId(v: unknown): v is MethodId {
  return typeof v === 'string' && (METHOD_IDS as string[]).includes(v);
}

export interface DeliverySettings {
  collect: { enabled: boolean; label: string; note: string };
  local: { enabled: boolean; label: string; note: string; price: number; districts: string };
  courier: { enabled: boolean; label: string; note: string; price: number };
}

export interface Method {
  id: MethodId;
  label: string;
  note: string;
  price: number;
}

const FALLBACK_LABELS: Record<MethodId, string> = {
  collect: 'Collect from the Houseplant Hospital',
  local: 'Local delivery',
  courier: 'Packed and posted, UK',
};

/** The methods she has switched on, in a fixed order. */
export function enabledMethods(d: DeliverySettings): Method[] {
  return METHOD_IDS.filter((id) => d[id]?.enabled).map((id) => ({
    id,
    label: d[id].label?.trim() || FALLBACK_LABELS[id],
    note: d[id].note?.trim() || '',
    price: id === 'collect' ? 0 : Math.max(0, Number((d[id] as { price?: number }).price) || 0),
  }));
}

/* ---------- postcodes ---------- */

/* "BS1, BS2 ,bs3" -> ["BS1","BS2","BS3"]. Written loosely by a person, read
   strictly by the code. */
export function parseDistricts(list: string): string[] {
  return list
    .split(/[,\s]+/)
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
}

/* The OUTWARD code of a UK postcode: "bs6 5ab" -> "BS6". Matching on that,
   rather than on the start of the string, is what stops "BS10" counting as
   inside "BS1". */
export function outwardCode(postcode: string): string | null {
  const clean = postcode.toUpperCase().replace(/\s+/g, '');
  const m = clean.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})?$/);
  return m ? m[1] : null;
}

export function deliversTo(postcode: string, districts: string): boolean {
  const out = outwardCode(postcode);
  return !!out && parseDistricts(districts).includes(out);
}

/* ---------- ordering ---------- */

/* The shop's running order comes from one list she drags into shape
   ("Shop order" in Keystatic), as on the Molly build. Anything missing from
   the list goes to the END rather than vanishing, so forgetting the list can
   never hide something from the site. */
export function byList<T extends { id: string; data: { title: string } }>(entries: T[], list: (string | null)[]): T[] {
  const rank = new Map<string, number>();
  list.forEach((id, i) => {
    if (id && !rank.has(id)) rank.set(id, i);
  });
  return [...entries].sort((a, b) => {
    const ra = rank.get(a.id) ?? Infinity;
    const rb = rank.get(b.id) ?? Infinity;
    if (ra !== rb) return ra - rb;
    return a.data.title.localeCompare(b.data.title);
  });
}
