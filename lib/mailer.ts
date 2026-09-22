/**
 * Pluggable transactional email. Uses Resend when RESEND_API_KEY is set;
 * otherwise logs to the server console so local dev "sends" are inspectable.
 *
 * To go live: set RESEND_API_KEY + MAIL_FROM in the environment. No code
 * changes needed anywhere — every caller goes through sendEmail().
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  delivered: boolean;
  provider: "resend" | "console";
  emailId?: string;
  error?: string;
  rawResponse?: unknown;
}

function getFormattedMailFrom(): string {
  const raw = (process.env.MAIL_FROM ?? "").trim();
  if (!raw) return "GoHackerz <hello@gohackerz.com>";
  if (raw.includes("<") && !raw.endsWith(">")) {
    return `${raw}>`;
  }
  return raw;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.info(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "info",
        event: "email.console_transport",
        to: msg.to,
        subject: msg.subject,
      })
    );
    return { delivered: false, provider: "console" };
  }

  try {
    const from = getFormattedMailFrom();
    const text = stripHtmlToText(msg.html);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text,
        reply_to: "hello@gohackerz.com",
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { delivered: false, provider: "resend", error: JSON.stringify(data || {}), rawResponse: data };
    }
    return { delivered: true, provider: "resend", emailId: data?.id, rawResponse: data };
  } catch (e) {
    return {
      delivered: false,
      provider: "resend",
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

// ── Templates ─────────────────────────────────────────────────

const shell = (title: string, body: string) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <div style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#7c5cff">GOHACKERZ</div>
    <h1 style="font-size:22px;margin:12px 0">${title}</h1>
    ${body}
    <p style="color:#8b84ad;font-size:12px;margin-top:28px">You're receiving this because someone subscribed this address at gohackerz.com.</p>
  </div>`;

export function confirmEmail(to: string, token: string): EmailMessage {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${site}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Confirm your GoHackerz subscription",
    html: shell(
      "One click and you're in",
      `<p>Confirm your subscription to get the best engineering essays, teardowns and post-mortems.</p>
       <p><a href="${url}" style="display:inline-block;background:#7c5cff;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">Confirm subscription</a></p>
       <p style="font-size:12px;color:#8b84ad">Or paste this link: ${url}</p>`
    ),
  };
}

export function welcomeEmail(to: string): EmailMessage {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    to,
    subject: "You're in — welcome to GoHackerz",
    html: shell(
      "Welcome aboard ⚡",
      `<p>You'll get new essays on engineering, systems and building software — no fluff, no growth-hack listicles.</p>
       <p><a href="${site}" style="color:#7c5cff;font-weight:700">Read the latest →</a></p>`
    ),
  };
}

export function articleApprovedEmail(to: string, title: string, slug: string): EmailMessage {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${site}/article/${slug}`;
  return {
    to,
    subject: `Your article "${title}" is live on GoHackerz!`,
    html: shell(
      "Your article is published! 🎉",
      `<p>Great news! Your submission <strong>"${title}"</strong> has been reviewed and published to GoHackerz.</p>
       <p><a href="${url}" style="display:inline-block;background:#7c5cff;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">View live article →</a></p>`
    ),
  };
}

export function articleRejectedEmail(to: string, title: string, feedback: string): EmailMessage {
  return {
    to,
    subject: `Editorial update on "${title}"`,
    html: shell(
      "Editorial review notes",
      `<p>Thank you for submitting <strong>"${title}"</strong> to GoHackerz.</p>
       <p>Our editorial team reviewed your post and has suggested some updates before it can be published:</p>
       <blockquote style="border-left:4px solid #ff7b9c;padding-left:12px;margin:16px 0;color:#333;background:#fff5f7;padding-top:8px;padding-bottom:8px">
         ${feedback}
       </blockquote>
       <p>You can update your draft anytime in your writer workspace and resubmit for review.</p>`
    ),
  };
}

export function passwordResetEmail(to: string, resetUrl: string): EmailMessage {
  return {
    to,
    subject: "Reset your GoHackerz password",
    html: shell(
      "Reset your password",
      `<p>We received a request to reset your GoHackerz password. Click the button below to set a new password:</p>
       <p><a href="${resetUrl}" style="display:inline-block;background:#7c5cff;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">Reset Password</a></p>
       <p style="font-size:12px;color:#8b84ad;margin-top:16px">Or paste this link into your browser: ${resetUrl}</p>
       <p style="font-size:12px;color:#8b84ad">If you didn't request a password reset, you can safely ignore this email.</p>`
    ),
  };
}

export function accountConfirmationEmail(to: string, confirmUrl: string): EmailMessage {
  return {
    to,
    subject: "Confirm your GoHackerz account",
    html: shell(
      "Confirm your account ⚡",
      `<p>Welcome to GoHackerz! Click the button below to confirm your email and activate your account:</p>
       <p><a href="${confirmUrl}" style="display:inline-block;background:#7c5cff;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">Confirm & Activate Account →</a></p>
       <p style="font-size:12px;color:#8b84ad;margin-top:16px">Or copy and paste this link into your browser:<br/>${confirmUrl}</p>`
    ),
  };
}


