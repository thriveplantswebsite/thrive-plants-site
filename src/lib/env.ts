/* ============================================================
   ENVIRONMENT — secrets and storage, read the Cloudflare way.

   On Workers, secrets are not in process.env. They arrive on each request as
   `locals.runtime.env`, alongside the KV store. In `astro dev` the adapter's
   platform proxy fills the same object from .dev.vars and a local KV, so this
   one function works in both places.

   This file is the host-specific seam. Moving the site to another host means
   changing how this function finds its values, not hunting through every
   endpoint for `locals.runtime`.
   ============================================================ */

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  list(opts?: { prefix?: string; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

export interface Env {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  /** Where enquiries are sent. */
  ENQUIRY_TO?: string;
  /** The verified sender, e.g. "Thrive website <website@thriveplantsbristol.co.uk>". */
  ENQUIRY_FROM?: string;
  SOLD?: KVLike;
}

export function getEnv(locals: App.Locals): Env {
  const runtime = (locals as { runtime?: { env?: Env } }).runtime;
  return runtime?.env ?? {};
}
