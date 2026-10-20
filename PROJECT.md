# thrive plants bristol: project notes

Mandie's site. Bristol's houseplant hospital: diagnosis and treatment
booked through cal.com, a shop of one-off plants in second-hand pots, gift
vouchers, and plant supply and care for businesses.

Design is **Jungle Night** (look 3 of the mockup at
thrive-plants-mockup.netlify.app), which Mandie picked "with some
rejigging". What that rejigging means is not known yet. Colours and type
are all tokens at the top of `src/styles/global.css`, and each section of
each page is its own block, so changes should be contained.

Setting up accounts and going live: **SETUP.md**.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

`http://localhost:4321` is the site; `/keystatic` is the editor, which
saves straight to the files on disk with no login.

`npm run preview` builds the real thing and runs it in Cloudflare's own
runtime (`wrangler dev`, at `http://localhost:8787`). Use it to test
anything server-side before deploying.

**The project folder must not have a space in its path.** Vite's dev server
fails to serve Keystatic's editor from a path with a space (it 404s on
URL-encoded `@` paths). That is why this lives at
`Desktop/thrive-plants-site` and not inside `Desktop/thrive plants`.

## Stack, and why

- **Astro 5 + Keystatic**, the same as the Molly Moreno and Katherine Griffin
  sites.
- **Cloudflare Workers** for hosting, not Netlify. On Netlify's free plan,
  every deploy and every visitor draws from the same 300 monthly credits,
  and running out pauses every site on the account. On Workers, pages,
  images and CSS are free and unlimited, and there are 3,000 build minutes a
  month. A client going viral costs nothing.
- **Astro 7 was tried first and abandoned.** Its Cloudflare adapter runs dev
  inside Cloudflare's runtime, which has no file system, so Keystatic's
  local editing will not run. Moving dev to Node then hit Vite 8 failing on
  Keystatic's CommonJS dependencies. Revisit when Keystatic supports it.
- **Images are resized at build time** (`imageService: 'compile'`), so every
  size is a static file, which is the free kind of request.
- **No publish button**, unlike the Molly build. With 3,000 build minutes
  instead of about 20 deploys a month, every Keystatic save can simply go
  live.

## Where things are

```
src/content.config.ts   what the build accepts (Zod)
keystatic.config.ts     what Mandie can edit (must mirror the above)
src/content/            all the words, prices and settings
src/assets/images/      all photos (resized at build)
src/lib/shop.ts         money, delivery and postcode rules
src/lib/basket.ts       the basket (ids only, in localStorage)
src/lib/sold.ts         one-off sold/held tracking in Cloudflare KV
src/lib/email.ts        enquiry emails via Resend
src/lib/env.ts          the one Cloudflare-specific seam for secrets
src/lib/icons.ts        the only icons the site can show
src/pages/api/          checkout, voucher, stripe-webhook, sold, enquiry
scripts/seed-content.py wrote the starting content; do not run again
```

## How the shop works

Every item is a one-off, so there are no stock counts: an item is
available until it sells, then it shows as **Rehomed**.

1. The basket keeps only item ids. Prices shown in the basket are for
   display.
2. `/api/checkout` re-prices everything from the content files, checks each
   item is still available, and checks nobody else is mid-checkout with it.
3. It then **holds** the items in KV for 30 minutes, the lifetime of the
   Stripe session, so two people cannot pay for the same pot.
4. When Stripe confirms payment, `/api/stripe-webhook` marks the items
   **sold** in KV. The shop reads that list on page load (`/api/sold`), so
   a sale shows up straight away without a rebuild.
5. Mandie can also mark things sold or hidden by hand in Keystatic, for
   sales at fairs.

The sold list is one KV record that is **read**, not a list of keys: KV's
free plan allows 100,000 reads a day but only 1,000 list operations.

While "Shop is not open yet" is ticked in Keystatic, the shop shows
everything but nothing can be bought, and gift vouchers are off too.

**Delivery** has three options, each switched on or off in Keystatic:
collection (free), local delivery (postcode-checked against a list of
districts, BS1 to BS9 by default, in the basket and again on the server),
and packed-and-posted UK courier, which is **off** until Mandie confirms she
will post plants.

**Gift vouchers** are a Stripe payment with the recipient's name and
message attached. Mandie sends the voucher herself. Automatic codes were
left out on purpose; see the note in `src/pages/api/voucher.ts`.

**Booking** is her live cal.com calendar, embedded. Bookings made on the
site are real bookings in her account.

**Enquiries** (contact and business forms) post to `/api/enquiry`, which
emails her through Resend. Spam is stopped with a honeypot and a minimum
time on the page.

## Placeholders

All of these are stand-ins until Mandie supplies her own:

- **Every photo.** The plant and shop photos are Unsplash stock from the
  mockup. The photo of Mandie is a crop from her Instagram. The home page
  background is stock.
- **The logo** in `src/assets/brand/` is a temporary redraw from an
  Instagram screenshot. Replace both files, keeping the filenames.
- **The eight shop items** are samples (ticked "Sample item").
- **Copy marked `[PLACEHOLDER]`** in `src/content/`. Everything else is
  Mandie's own wording from her Instagram and cal.com pages.
- **Prices** other than "from £8" and the £8 pick-up fee, and the £5 local
  delivery charge.
- `site` in `astro.config.mjs`, the KV id in `wrangler.jsonc`, the GitHub
  owner in `keystatic.config.ts`, and `public/robots.txt`.

## To confirm with Mandie

- What she means by "rejigging" Jungle Night.
- Her logo file, or whether she wants to rework it.
- Delivery: local only, or packed and posted further afield? What does
  local delivery cost?
- Treatment prices beyond "from £8".
- Whether business pricing goes on the site or stays "get a quote".
- Domain name, and an email address on it.
- Her own photos, especially before-and-afters for "Recent patients".

## House rules

Carried over from the Molly and Katherine builds.

- **No em dashes in prose.** Commas or full stops.
- **British English.**
- **Prices in pounds in the content, pence only at the Stripe boundary**
  (`toPence` in `src/lib/shop.ts`, nowhere else).
- **Invented copy is marked `[PLACEHOLDER]`.**
- **Comments explain why, not what.**

## Gotchas found while building

- A self-closing `<template>` inside a `.map()` in an Astro template sends
  the Astro compiler into an infinite loop, and the build hangs forever at
  "Building server entrypoints" with no error. See `src/pages/shop/[id].astro`.
- Importing all of `lucide-static` (2,000+ icons) is slow to bundle. Icons
  are listed explicitly in `src/lib/icons.ts`.
- Styles on Astro's `<Image>` component need `:global()`, because scoped
  styles do not reach it.
- Astro rejects form posts without an `Origin` header (403). Browsers always
  send one; when testing with curl, add `-H "Origin: http://localhost:4321"`.
