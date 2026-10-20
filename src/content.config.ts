import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ============================================================
   CONTENT SCHEMAS — the source of truth for the BUILD.

   These mirror keystatic.config.ts, which is the source of truth for the
   EDITOR. Zod here fails the build on bad data; Keystatic there decides what
   Mandie can type. Add a field in one and you must add it in the other, or
   she will fill in something the build then rejects.

   Almost everything defaults. The failure mode of a required field is a
   build that breaks the moment she clears a box, and she will clear boxes.
   The exceptions are things a page genuinely cannot render without: a
   product's name, price and first photograph.

   Images use Astro's image() helper, so every photo is resized when the site
   builds. Each size is then a static file, which on Cloudflare Workers is
   the free and unlimited kind of request.
   ============================================================ */

const text = z.string().default('');

/* Keystatic writes null, not undefined, for an emptied optional field. */
const maybe = <T extends z.ZodTypeAny>(t: T) => t.nullable().optional();

const step = z.object({ title: text, body: text });

/* One small file per page of the site, because that is how she thinks
   about it ("I want to change something on the shop page"). */
const pageFile = (file: string) => glob({ pattern: file, base: './src/content/pages' });

const settings = defineCollection({
  loader: glob({ pattern: 'settings.json', base: './src/content' }),
  schema: ({ image }) =>
    z.object({
      tagline: text,
      /* The default share description, used when a page sets none. */
      description: text,
      whatsapp: text,
      instagram: text,
      /* A blank email means no address is printed anywhere, rather than a
         placeholder that looks real. */
      email: text,
      serviceArea: text,
      /* Her cal.com username and the two event links. Here rather than in
         code so a renamed event in cal.com is a CMS edit, not a deploy. */
      calUser: text,
      dropOffEvent: text,
      pickUpEvent: text,
      shareImage: maybe(image()),
      shareImageAlt: text,
    }),
});

const homePage = defineCollection({
  loader: pageFile('home.json'),
  schema: ({ image }) =>
    z.object({
      heroLine1: text,
      heroLine2: text,
      heroLead: text,
      heroImage: maybe(image()),
      stepsHeading: text,
      steps: z.array(step).default([]),
      symptomsHeading: text,
      symptomsIntro: text,
      symptoms: z.array(z.object({ label: text, icon: z.string().default('leaf') })).default([]),
      servicesHeading: text,
      services: z
        .array(z.object({ title: text, body: text, link: text, linkLabel: text, image: maybe(image()) }))
        .default([]),
      patientsHeading: text,
      patients: z
        .array(z.object({ title: text, note: text, image: maybe(image()), placeholder: z.boolean().default(false) }))
        .default([]),
      aboutEyebrow: text,
      aboutHeading: text,
      aboutBody: text,
      aboutImage: maybe(image()),
    }),
});

const hospitalPage = defineCollection({
  loader: pageFile('hospital.json'),
  schema: ({ image }) =>
    z.object({
      heading: text,
      intro: text,
      dropOff: text,
      pickUp: text,
      treatmentsHeading: text,
      treatments: z.array(z.object({ name: text, description: text, price: text })).default([]),
      treatmentsNote: text,
      careCard: z.object({ plant: text, light: text, water: text, feed: text, treated: text }).default({}),
      faqs: z.array(z.object({ question: text, answer: text })).default([]),
      image: maybe(image()),
    }),
});

const shopPage = defineCollection({
  loader: pageFile('shop.json'),
  schema: z.object({
    heading: text,
    intro: text,
    /* While ticked, the shop shows its items but every Add button says
       "Coming soon" and the checkout refuses orders. Lets her show the shop
       before Stripe is set up without anyone being able to pay. */
    comingSoon: z.boolean().default(true),
    promises: z.array(step).default([]),
    emptyBasket: text,
    afterOrder: text,
  }),
});

const businessPage = defineCollection({
  loader: pageFile('business.json'),
  schema: ({ image }) =>
    z.object({
      heading: text,
      intro: text,
      image: maybe(image()),
      imageAlt: text,
      offers: z.array(step).default([]),
      whoHeading: text,
      who: z.array(z.object({ label: text, icon: z.string().default('briefcase') })).default([]),
      formHeading: text,
      formIntro: text,
    }),
});

const vouchersPage = defineCollection({
  loader: pageFile('vouchers.json'),
  schema: z.object({
    heading: text,
    intro: text,
    /* Whole pounds. The checkout only ever accepts one of these, so the
       price of a voucher cannot be changed by editing the page in a browser. */
    amounts: z.array(z.number().int().positive()).default([15, 25, 50]),
    points: z.array(z.string()).default([]),
    afterOrder: text,
  }),
});

const aboutPage = defineCollection({
  /* Markdoc so the story gets paragraphs and links without her meeting any
     syntax. The rest of the page is plain fields. */
  loader: pageFile('about.mdoc'),
  schema: ({ image }) =>
    z.object({
      heading: text,
      portrait: maybe(image()),
      portraitAlt: text,
      values: z.array(step).default([]),
    }),
});

const bookPage = defineCollection({
  loader: pageFile('book.json'),
  schema: z.object({
    heading: text,
    intro: text,
    dropOffTitle: text,
    dropOffBody: text,
    pickUpTitle: text,
    pickUpBody: text,
  }),
});

const contactPage = defineCollection({
  loader: pageFile('contact.json'),
  schema: z.object({ heading: text, intro: text, afterMessage: text }),
});

/* SHOP. Every plant and pot she sells is a one-off (a rehomed plant in a
   second-hand pot), so there is no stock count: an item is available until
   it sells, and then it is "Rehomed". Selling through the checkout marks it
   automatically (src/lib/sold.ts). `status` is for marking things by hand,
   such as something sold at a fair. */
const products = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/products' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      /* POUNDS, as she types it. Converted to pence exactly once, at the
         Stripe boundary in src/lib/shop.ts. */
      price: z.number().positive(),
      pot: text,
      kind: z.enum(['plant-and-pot', 'pot', 'plant', 'other']).default('plant-and-pot'),
      /* A short fixed list of badges, so the shop does not fill up with
         one-off labels that mean nothing to a visitor. */
      easyCare: z.boolean().default(false),
      petSafe: z.boolean().default(false),
      status: z.enum(['available', 'sold', 'hidden']).default('available'),
      images: z.array(z.object({ image: image(), alt: text })).min(1),
      /* Sample items made for the mockup, flagged so they can be found and
         deleted before launch. Nothing on the page shows the flag. */
      placeholder: z.boolean().default(false),
    }),
});

const shopOrder = defineCollection({
  loader: glob({ pattern: 'shop-order.json', base: './src/content' }),
  schema: z.object({ items: z.array(z.string().nullable()).default([]) }),
});

/* DELIVERY. Three ways to get a plant home, each switched on or off by her.
   The courier option exists but starts switched off: whether plants can be
   packed and sent further afield is still to be confirmed with Mandie. */
const delivery = defineCollection({
  loader: glob({ pattern: 'delivery.json', base: './src/content' }),
  schema: z.object({
    collect: z.object({ enabled: z.boolean().default(true), label: text, note: text }).default({}),
    local: z
      .object({
        enabled: z.boolean().default(true),
        label: text,
        note: text,
        price: z.number().min(0).default(0),
        /* Postcode districts she delivers to, written as she would write
           them: "BS1, BS2, BS3". Checked in the basket and again on the
           server, because the basket is not to be trusted. */
        districts: text,
      })
      .default({}),
    courier: z
      .object({ enabled: z.boolean().default(false), label: text, note: text, price: z.number().min(0).default(0) })
      .default({}),
  }),
});

/* LEGAL. Empty until she writes them, as on the Molly build. A privacy
   policy carries her name and her decisions, so this repo cannot honestly
   write one. With no entries, /privacy and /returns are genuine 404s and the
   footer shows no link to either; saving one in the CMS switches it on. */
const legal = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/legal' }),
  schema: z.object({ title: z.string(), navLabel: z.string(), order: z.number().default(10) }),
});

export const collections = {
  settings,
  homePage,
  hospitalPage,
  shopPage,
  businessPage,
  vouchersPage,
  aboutPage,
  bookPage,
  contactPage,
  products,
  shopOrder,
  delivery,
  legal,
};
