# Thrive site: going live checklist

Everything below needs an account. Nothing here is needed to work on the
site locally (`npm run dev`).

Do the steps in order: each one needs the one before it.

Every account is made with the **project email**, so the whole lot can be
handed to Mandie at the end by changing one password.

---

## 1. GitHub

Done. The account is `thriveplantswebsite`, the repository is
`thriveplantswebsite/thrive-plants-site` (public for now; it holds no
secrets, and switching it to private later breaks nothing), and `duboispaceai`
is a collaborator so pushes work from the build machine's existing login.

Mandie will need to be able to sign in to this account (or be added as a
collaborator) to use the editor, because every save in Keystatic is a commit
made as her.

## 2. Cloudflare

1. Create a Cloudflare account with the project email. The free plan is all
   this needs.
2. Create the sold-items store, once, from this folder:

   ```bash
   npx wrangler login
   ```

   ```bash
   npx wrangler kv namespace create SOLD
   ```

   Paste the `id` it prints into `wrangler.jsonc`, replacing
   `REPLACE-WITH-KV-NAMESPACE-ID`. Commit and push.
3. In the Cloudflare dashboard: **Workers & Pages → Create → Import a
   repository**, and pick the GitHub repo.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Under build variables, add `NODE_VERSION` = `22`.
4. Deploy. The site is now live at `thrive-plants-site.<account>.workers.dev`.
   Every push to the repo (including every Keystatic save) redeploys it in
   about a minute. The free plan includes 3,000 build minutes a month.

## 3. Keystatic (the editor)

1. Open `/keystatic` on the live address. It walks you through creating a
   GitHub App and gives you four values.
2. In Cloudflare, under the worker's **Settings → Variables and Secrets**,
   add these as **secrets**:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
3. Add `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` as a **build variable**, not a
   runtime secret. It is written into the editor's page when the site
   builds, so it has to exist at build time.
4. Redeploy. `/keystatic` now signs in with GitHub and saves.
5. When the real domain is connected (step 6), add the new address to the
   GitHub App's allowed callback URLs:
   `https://YOUR-DOMAIN/api/keystatic/github/oauth/callback`

## 4. Stripe

Start in test mode. Nothing on the site takes real money until the live key
goes in.

1. Mandie needs her own Stripe account; the money goes to her.
2. Copy the secret key (`sk_test_…`) into Cloudflare as the secret
   `STRIPE_SECRET_KEY`.
3. In Stripe: **Developers → Webhooks → Add endpoint**
   - URL: `https://YOUR-ADDRESS/api/stripe-webhook`
   - Events: `checkout.session.completed` and
     `checkout.session.async_payment_succeeded`
   - Copy its signing secret (`whsec_…`) into Cloudflare as
     `STRIPE_WEBHOOK_SECRET`.

   This is what marks a one-off pot as rehomed the moment it is paid for.
4. In Stripe **Settings → Emails**, switch on receipts for successful
   payments. The site does not send receipts itself.
5. In Keystatic, **Shop page → untick "Shop is not open yet"**. That opens
   both the shop and gift vouchers.
6. Test a purchase with Stripe's test card `4242 4242 4242 4242`. Then swap
   in the live key (`sk_live_…`) and a live webhook.

## 5. Email for the enquiry forms

The contact and business forms are sent through Resend's free plan.

1. Create a Resend account with the project email.
2. Add and verify the domain (this needs step 6 first). Until then, Resend
   will only deliver to the account's own email address, which is fine for
   testing.
3. Add three secrets in Cloudflare:
   - `RESEND_API_KEY`
   - `ENQUIRY_TO`: where enquiries go, e.g. Mandie's Gmail. Several
     addresses can be comma-separated.
   - `ENQUIRY_FROM`: e.g. `Thrive website <website@YOUR-DOMAIN>`
4. Send a test message from `/contact`.

Until these are set, the forms show the visitor an error rather than
pretending to send. A form that silently loses enquiries is worse than one
that says it is broken.

If spam ever gets through the two built-in checks, add Cloudflare Turnstile
(free). See the note in `src/pages/api/enquiry.ts`.

## 6. Domain

1. Buy the domain through Cloudflare Registrar, which charges the renewal at
   cost. A .co.uk is roughly £10 a year.
2. In the worker's **Settings → Domains & Routes**, add it as a custom
   domain.
3. In `astro.config.mjs`, set `site` to the real address. Canonical links,
   link previews and the sitemap all come from it.
4. Cloudflare's free Email Routing can forward `hello@YOUR-DOMAIN` to
   Mandie's Gmail.

## 7. Before launch

- Replace every `[PLACEHOLDER]` (search the repo) with Mandie's own words or
  delete it.
- Delete the eight sample shop items (ticked "Sample item" in Keystatic).
- Swap every photo; they are all stand-ins. See PROJECT.md.
- Swap the logo files in `src/assets/brand/` for her real logo (same
  filenames).
- Write the privacy policy and delivery/returns pages in Keystatic ("Small
  print"). The footer links appear once they exist.
- Replace `public/robots.txt` with the launch version described in it, so
  Google can find the site.
- Set the real delivery prices and postcodes in Keystatic, **Shop →
  Collection and delivery**.

## Secrets at a glance

| Name | Where it comes from | Type |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe, Developers → API keys | Secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe, the webhook endpoint | Secret |
| `RESEND_API_KEY` | Resend, API keys | Secret |
| `ENQUIRY_TO` | Mandie's inbox | Secret |
| `ENQUIRY_FROM` | A verified sender on her domain | Secret |
| `KEYSTATIC_GITHUB_CLIENT_ID` | Keystatic setup screen | Secret |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | Keystatic setup screen | Secret |
| `KEYSTATIC_SECRET` | Keystatic setup screen | Secret |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Keystatic setup screen | Build variable |
| `NODE_VERSION` = `22` | Set by hand | Build variable |

For local testing, copy `.dev.vars.example` to `.dev.vars` and fill in test
values. `.dev.vars` is git-ignored and must never be committed.
