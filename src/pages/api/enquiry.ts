import type { APIRoute } from 'astro';
import { getEnv } from '../../lib/env';
import { emailConfigured, send } from '../../lib/email';

/* ============================================================
   ENQUIRIES — the contact form and the business form, sent to her inbox.

   A plain HTML form post, so it works with JavaScript switched off. The
   answer is a redirect to /thank-you, or back to the form with ?error=.

   SPAM. Two cheap checks that stop nearly all of it without a puzzle for
   real people:
   - a honeypot field hidden from humans (bots fill in every box), and
   - a minimum time on the page, from a timestamp written when the page
     loaded. A person cannot read and fill in a form in two seconds.
   Both fail SILENTLY: a bot gets the same thank-you page a person does, so
   it learns nothing from trying again. If spam ever gets through, the next
   step is Cloudflare Turnstile, which is free; see SETUP.md.
   ============================================================ */

export const prerender = false;

const FORMS = {
  contact: { subject: 'New message from the website', back: '/contact' },
  business: { subject: 'New business enquiry from the website', back: '/business' },
} as const;
type FormId = keyof typeof FORMS;

const LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  business: 'Business',
  space: 'Type of space',
  plants: 'Roughly how many plants',
  message: 'Message',
};

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const env = getEnv(locals);
  const data = await request.formData().catch(() => null);
  if (!data) return redirect('/contact?error=read', 303);

  const formId = String(data.get('form') ?? '') as FormId;
  const form = FORMS[formId] ?? FORMS.contact;

  /* ---- spam checks, silent on failure ---- */
  const honeypot = String(data.get('website') ?? '');
  const startedAt = Number(data.get('t') ?? 0);
  const tooFast = !startedAt || Date.now() - startedAt < 2500;
  if (honeypot || tooFast) return redirect(`/thank-you?form=${formId}`, 303);

  const field = (k: string, max = 2000) => String(data.get(k) ?? '').trim().slice(0, max);
  const name = field('name', 120);
  const email = field('email', 200);
  const message = field('message', 5000);
  if (!name || !email.includes('@') || !message) return redirect(`${form.back}?error=missing#form`, 303);

  /* In production a site that silently logs enquiries is a site that loses
     customers, so an unconfigured email service is an error there. In dev it
     logs, so the form can be tested before Resend exists. */
  if (import.meta.env.PROD && !emailConfigured(env)) {
    console.error('Enquiry received but email is not configured. Set RESEND_API_KEY, ENQUIRY_TO and ENQUIRY_FROM.');
    return redirect(`${form.back}?error=send#form`, 303);
  }

  const lines = Object.keys(LABELS)
    .map((k) => [LABELS[k], field(k)] as const)
    .filter(([, v]) => v)
    .map(([label, v]) => (label === 'Message' ? `\n${v}` : `${label}: ${v}`));

  const result = await send(env, {
    subject: `${form.subject}: ${name}`,
    text: lines.join('\n') + '\n\n(Reply to this email to answer them directly.)',
    replyTo: email,
  });

  return result.ok ? redirect(`/thank-you?form=${formId}`, 303) : redirect(`${form.back}?error=send#form`, 303);
};
