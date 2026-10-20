import type { Env } from './env';

/* ============================================================
   EMAIL — how a form submission reaches Mandie's inbox.

   Replaces Netlify Forms, which this host does not have. One plain fetch to
   Resend's API rather than their SDK, so it runs on Workers with nothing
   extra bundled, and so swapping to another sending service later is a
   change to this one file.

   Before Resend is set up, a submission is logged to the server console and
   reported as sent. That keeps every form testable in local dev, and it is
   why /api/enquiry refuses to pretend in production: see `configured`.
   ============================================================ */

export interface Message {
  subject: string;
  /** Plain text. Enquiries are read on a phone; HTML adds nothing here. */
  text: string;
  replyTo?: string;
}

export function emailConfigured(env: Env): boolean {
  return !!(env.RESEND_API_KEY && env.ENQUIRY_TO && env.ENQUIRY_FROM);
}

export async function send(env: Env, msg: Message): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!emailConfigured(env)) {
    console.log('[email: not configured, logged instead]\n' + msg.subject + '\n\n' + msg.text);
    return { ok: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.ENQUIRY_FROM,
      to: env.ENQUIRY_TO!.split(',').map((s) => s.trim()),
      subject: msg.subject,
      text: msg.text,
      /* So pressing Reply in her inbox answers the customer, not the
         website's sending address. */
      reply_to: msg.replyTo,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Resend refused the email', res.status, detail);
    return { ok: false, error: `Email service returned ${res.status}` };
  }
  return { ok: true };
}
