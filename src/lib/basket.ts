/* ============================================================
   THE BASKET — what the visitor has picked up, held in the browser.

   Ported from the Molly build. localStorage plus a custom event: the site is
   static HTML, and a basket has to survive a full page load between /shop
   and /basket, which rules out anything held in memory.

   ONLY IDS ARE STORED. No price, no title, no picture. Prices are read fresh
   from the content on every render and again by the checkout, so a basket
   left open for a month cannot quote last month's price.

   Every item here is a one-off, so a line is either in the basket or not.
   There is no quantity to get wrong.
   ============================================================ */

const KEY = 'thrive.basket.v1';

/** Fired on `window` whenever the basket changes, including in another tab. */
export const BASKET_EVENT = 'thrive:basket';

/** Never throws. Safari private mode throws on localStorage access alone, and
    a broken basket should be an empty basket, not an error page. */
export function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? [...new Set(parsed.filter((v) => typeof v === 'string'))] : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* Storage full or blocked: the basket will not persist, but the page
       still works, which is the right failure. */
  }
  window.dispatchEvent(new CustomEvent(BASKET_EVENT));
}

export const count = (): number => read().length;
export const has = (id: string): boolean => read().includes(id);
export const add = (id: string): void => write([...read(), id]);
export const remove = (id: string): void => write(read().filter((x) => x !== id));
export const clear = (): void => write([]);

/** Subscribe to changes, including ones made in another tab. */
export function subscribe(fn: () => void): () => void {
  const onLocal = () => fn();
  /* `storage` only fires in OTHER tabs, which is exactly the case the custom
     event cannot cover. */
  const onOther = (e: StorageEvent) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener(BASKET_EVENT, onLocal);
  window.addEventListener('storage', onOther);
  return () => {
    window.removeEventListener(BASKET_EVENT, onLocal);
    window.removeEventListener('storage', onOther);
  };
}
