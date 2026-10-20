import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { byList } from './shop';

/* Singletons are collections with one file. This reads that file's data,
   so pages say `await single('homePage')` instead of repeating the
   getCollection-then-index dance. */
export async function single<K extends CollectionKey>(name: K): Promise<CollectionEntry<K>['data']> {
  const [entry] = await getCollection(name);
  if (!entry) throw new Error(`Content file for "${name}" is missing. It should exist under src/content.`);
  return entry.data;
}

/** Products in the order she set, hidden ones removed. */
export async function shopProducts(): Promise<CollectionEntry<'products'>[]> {
  const products = await getCollection('products', (p) => p.data.status !== 'hidden');
  const order = (await getCollection('shopOrder'))[0]?.data.items ?? [];
  return byList(products, order);
}

/** cal.com links, built from the settings so a renamed event is a CMS edit. */
export function calLinks(s: { calUser: string; dropOffEvent: string; pickUpEvent: string }) {
  const user = s.calUser || 'thrive-plants-bristol';
  return {
    profile: `https://cal.com/${user}`,
    dropOff: `${user}/${s.dropOffEvent || 'drop-off'}`,
    pickUp: `${user}/${s.pickUpEvent || 'pick-up'}`,
  };
}
