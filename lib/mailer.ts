/**
 * Pluggable transactional email.
 * Providers supported:
 * 1. Resend (when RESEND_API_KEY is set) with auto-fallback to onboarding@resend.dev
 * 2. Nodemailer / SMTP (when SMTP_HOST or GMAIL_USER is set)
 * 3. Local Console Inspector (when keys are unset)
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  delivered: boolean;
  provider: "resend" | "smtp" | "console";
  emailId?: string;
  error?: string;
  rawResponse?: unknown;
}

function getFormattedMailFrom(): string {
  const raw = (process.env.MAIL_FROM ?? "").trim();
  if (!raw) return "GoHackerz <onboarding@resend.dev>";
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
  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const gmailUser = process.env.GMAIL_USER;

  // ── 1. Resend Provider ──────────────────────────────────────────
  if (resendKey) {
    try {
      let from = getFormattedMailFrom();
      const text = stripHtmlToText(msg.html);

      let res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
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

      let data = await res.json().catch(() => null);

      // If domain was not verified, automatically retry with onboarding@resend.dev
      if (!res.ok && data?.message?.toLowerCase()?.includes("domain")) {
        console.warn("[Mailer] Custom domain unverified. Retrying via onboarding@resend.dev...");
        from = "GoHackerz <onboarding@resend.dev>";
        res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: msg.to,
            subject: msg.subject,
            html: msg.html,
            text,
          }),
        });
        data = await res.json().catch(() => null);
      }

      if (!res.ok) {
        console.error("[Mailer] Resend API error:", data);
        return {
          delivered: false,
          provider: "resend",
          error: JSON.stringify(data || {}),
          rawResponse: data,
        };
      }

      console.info(`[Mailer] Email sent successfully to ${msg.to} via Resend (ID: ${data?.id})`);
      return { delivered: true, provider: "resend", emailId: data?.id, rawResponse: data };
    } catch (e) {
      console.error("[Mailer] Resend network error:", e);
      return {
        delivered: false,
        provider: "resend",
        error: e instanceof Error ? e.message : "unknown",
      };
    }
  }

  // ── 2. SMTP / Nodemailer Provider ───────────────────────────────
  if (smtpHost || gmailUser) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport(
        gmailUser
          ? {
              service: "gmail",
              auth: {
                user: gmailUser,
                pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
              },
            }
          : {
              host: smtpHost,
              port: Number(process.env.SMTP_PORT || 587),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
      );

      const info = await transporter.sendMail({
        from: getFormattedMailFrom(),
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: stripHtmlToText(msg.html),
      });

      console.info(`[Mailer] Email sent successfully to ${msg.to} via SMTP (ID: ${info.messageId})`);
      return { delivered: true, provider: "smtp", emailId: info.messageId };
    } catch (smtpErr) {
      console.error("[Mailer] SMTP send error:", smtpErr);
      return {
        delivered: false,
        provider: "smtp",
        error: smtpErr instanceof Error ? smtpErr.message : "unknown",
      };
    }
  }

  // ── 3. Local Development Fallback (Console Transport) ───────────
  console.info(
    `\n═══════════════════════════════════════════════════════════════\n` +
      `📨 [LOCAL DEV EMAIL DISPATCHED] (No RESEND_API_KEY configured)\n` +
      `───────────────────────────────────────────────────────────────\n` +
      `To:      ${msg.to}\n` +
      `Subject: ${msg.subject}\n` +
      `Note:    To receive real emails in your inbox, set RESEND_API_KEY\n` +
      `         or SMTP_HOST/GMAIL_USER in .env.local\n` +
      `═══════════════════════════════════════════════════════════════\n`
  );
  return { delivered: false, provider: "console" };
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

export function hackerPassportEmail(params: {
  to: string;
  name: string;
  ticketNumber: string;
  roleTitle: string;
  teamName?: string;
  teamCode?: string;
  hackathonSlug: string;
  hackathonTitle: string;
}): EmailMessage {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const passUrl = `${site}/hackathons/${params.hackathonSlug}/pass/${params.ticketNumber}`;
  const submitUrl = `${site}/hackathons/${params.hackathonSlug}/submit?ticket=${params.ticketNumber}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    passUrl
  )}`;

  const body = `
    <div style="background-color:#0A071B;border:2px solid #7c5cff;border-radius:20px;padding:24px;color:#ffffff;margin:20px 0;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
      <div style="border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#C6FF3D;text-transform:uppercase;">OFFICIAL HACKER CREDENTIAL</span>
        <span style="font-family:monospace;font-size:14px;font-weight:900;color:#C6FF3D;background:#1A1440;padding:2px 8px;border-radius:4px;border:1px solid rgba(198,255,61,0.4);">#${params.ticketNumber}</span>
      </div>

      <h2 style="font-size:24px;margin:0 0 4px 0;color:#ffffff;font-weight:800;">${params.name}</h2>
      <p style="font-family:monospace;font-size:13px;color:#D4CEF5;margin:0 0 16px 0;">// ${params.roleTitle}</p>

      <table style="width:100%;margin-bottom:16px;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#8B84AD;font-size:12px;font-family:monospace;">ALLIANCE / TEAM:</td>
          <td style="padding:6px 0;color:#ffffff;font-size:13px;font-weight:700;text-align:right;">${params.teamName || "Solo Competitor"}</td>
        </tr>
        ${
          params.teamCode
            ? `
        <tr>
          <td style="padding:6px 0;color:#8B84AD;font-size:12px;font-family:monospace;">INVITE CODE:</td>
          <td style="padding:6px 0;color:#C6FF3D;font-size:13px;font-weight:700;font-family:monospace;text-align:right;">${params.teamCode}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding:6px 0;color:#8B84AD;font-size:12px;font-family:monospace;">EVENT:</td>
          <td style="padding:6px 0;color:#ffffff;font-size:13px;font-weight:700;text-align:right;">${params.hackathonTitle}</td>
        </tr>
      </table>

      <div style="text-align:center;padding:16px 0;background:#130E29;border-radius:14px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
        <img src="${qrApiUrl}" alt="Passport QR Code" style="width:140px;height:140px;border-radius:8px;border:3px solid #C6FF3D;" />
        <div style="font-family:monospace;font-size:10px;color:#D4CEF5;margin-top:8px;letter-spacing:1px;">SCAN TO OPEN PASSPORT ON ANY DEVICE</div>
      </div>

      <div style="text-align:center;">
        <a href="${passUrl}" style="display:inline-block;background:#C6FF3D;color:#0A071B;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:900;font-size:14px;font-family:monospace;letter-spacing:0.5px;">VIEW 3D HACKER PASSPORT →</a>
      </div>
    </div>

    <div style="margin-top:24px;font-size:13px;line-height:1.6;color:#555;">
      <h3 style="font-size:16px;color:#110D28;margin-bottom:8px;">Next Steps for the Shipathon:</h3>
      <ul style="padding-left:20px;margin:0 0 16px 0;">
        <li><strong>Share on X / Socials:</strong> Flex your holographic passport to recruit teammates and show you're competing.</li>
        <li><strong>Form your Squad:</strong> If building with a team, share your invite code <code>${params.teamCode || params.ticketNumber}</code>.</li>
        <li><strong>Build & Ship:</strong> Submissions are 100% lightweight link-based (<a href="${submitUrl}" style="color:#7c5cff;font-weight:700;">Submit Project Link</a>).</li>
      </ul>
      <p style="font-size:12px;color:#8B84AD;">Have questions or need help? Join our official community or reply directly to this email.</p>
    </div>
  `;

  return {
    to: params.to,
    subject: `⚡ Your Hacker Passport: #${params.ticketNumber} — ${params.hackathonTitle}`,
    html: shell(`Welcome to the Arena, ${params.name}! 🚀`, body),
  };
}

/**
 * 4. Admin Alert: New Hackathon Host Proposal Submitted
 */
export function hostProposalAdminNotificationEmail(proposal: {
  refNumber: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactHandle?: string;
  hackathonTitle: string;
  targetDates?: string;
  expectedParticipants?: string;
  estimatedPrizePool?: string;
  tracksAndGoals?: string;
  specialRequirements?: string;
  adminEmail: string;
}): EmailMessage {
  const body = `
    <div style="background-color:#0A071B;border:2px solid #C6FF3D;border-radius:20px;padding:24px;color:#ffffff;margin:20px 0;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
      <div style="border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#C6FF3D;text-transform:uppercase;">⚡ NEW HOST APPLICATION</span>
        <span style="font-family:monospace;font-size:13px;font-weight:900;color:#C6FF3D;background:#1A1440;padding:2px 8px;border-radius:4px;border:1px solid rgba(198,255,61,0.4);">${proposal.refNumber}</span>
      </div>

      <h2 style="font-size:22px;margin:0 0 4px 0;color:#ffffff;font-weight:800;">${proposal.hackathonTitle}</h2>
      <p style="font-family:monospace;font-size:13px;color:#D4CEF5;margin:0 0 16px 0;">Organizer: <strong>${proposal.orgName}</strong></p>

      <table style="width:100%;margin-bottom:16px;border-collapse:collapse;font-size:13px;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 0;color:#8B84AD;font-family:monospace;width:38%;">CONTACT PERSON:</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:700;text-align:right;">${proposal.contactName}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 0;color:#8B84AD;font-family:monospace;">EMAIL:</td>
          <td style="padding:8px 0;color:#C6FF3D;font-weight:700;text-align:right;"><a href="mailto:${proposal.contactEmail}" style="color:#C6FF3D;text-decoration:none;">${proposal.contactEmail}</a></td>
        </tr>
        ${
          proposal.contactHandle
            ? `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 0;color:#8B84AD;font-family:monospace;">HANDLE / PHONE:</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:700;text-align:right;">${proposal.contactHandle}</td>
        </tr>`
            : ""
        }
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 0;color:#8B84AD;font-family:monospace;">EXPECTED DATES:</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:700;text-align:right;">${proposal.targetDates || "Flexible / TBD"}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 0;color:#8B84AD;font-family:monospace;">BUILDER CAPACITY:</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:700;text-align:right;">👥 ${proposal.expectedParticipants || "100-300"}</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 0;color:#8B84AD;font-family:monospace;">PRIZE POOL / BUDGET:</td>
          <td style="padding:8px 0;color:#C6FF3D;font-weight:700;text-align:right;">💰 ${proposal.estimatedPrizePool || "TBD"}</td>
        </tr>
      </table>

      ${
        proposal.tracksAndGoals
          ? `
      <div style="background:#130E29;border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.1);margin-bottom:16px;">
        <div style="font-family:monospace;font-size:11px;color:#8B84AD;text-transform:uppercase;margin-bottom:6px;">PROPOSED TRACKS & GOALS:</div>
        <p style="font-size:13px;color:#ded8ff;margin:0;line-height:1.5;">${proposal.tracksAndGoals}</p>
      </div>`
          : ""
      }

      ${
        proposal.specialRequirements
          ? `
      <div style="background:#130E29;border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.1);margin-bottom:16px;">
        <div style="font-family:monospace;font-size:11px;color:#8B84AD;text-transform:uppercase;margin-bottom:6px;">ADDITIONAL NOTES:</div>
        <p style="font-size:13px;color:#ded8ff;margin:0;line-height:1.5;">${proposal.specialRequirements}</p>
      </div>`
          : ""
      }

      <div style="text-align:center;padding-top:8px;">
        <a href="mailto:${proposal.contactEmail}?subject=Re:%20GoHackerz%20Hackathon%20Partnership%20-%20${encodeURIComponent(
    proposal.hackathonTitle
  )}" style="display:inline-block;background:#C6FF3D;color:#0A071B;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:900;font-size:13px;font-family:monospace;">REPLY TO ORGANIZER →</a>
      </div>
    </div>
  `;

  return {
    to: proposal.adminEmail,
    subject: `🔥 New Hackathon Host Proposal: "${proposal.hackathonTitle}" (${proposal.orgName}) [Ref: ${proposal.refNumber}]`,
    html: shell(`New Hackathon Host Proposal Received! 🚀`, body),
  };
}

/**
 * 5. Applicant Receipt: Confirmation for Hackathon Proposal
 */
export function hostProposalReceiptEmail(proposal: {
  refNumber: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  hackathonTitle: string;
}): EmailMessage {
  const body = `
    <div style="background-color:#0A071B;border:2px solid #7c5cff;border-radius:20px;padding:24px;color:#ffffff;margin:20px 0;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
      <div style="border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#C6FF3D;text-transform:uppercase;">APPLICATION RECEIVED</span>
        <span style="font-family:monospace;font-size:13px;font-weight:900;color:#C6FF3D;background:#1A1440;padding:2px 8px;border-radius:4px;border:1px solid rgba(198,255,61,0.4);">${proposal.refNumber}</span>
      </div>

      <h2 style="font-size:22px;margin:0 0 6px 0;color:#ffffff;font-weight:800;">Hi ${proposal.contactName},</h2>
      <p style="font-size:14px;color:#D4CEF5;line-height:1.6;margin:0 0 16px 0;">
        Thank you for submitting your proposal to host <strong>${proposal.hackathonTitle}</strong> on GoHackerz! We have received your application and our events team is reviewing the details.
      </p>

      <div style="background:#130E29;border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
        <h3 style="font-size:14px;color:#C6FF3D;margin:0 0 10px 0;font-family:monospace;text-transform:uppercase;">What GoHackerz provides your Hackathon:</h3>
        <ul style="padding-left:20px;margin:0;color:#ded8ff;font-size:13px;line-height:1.6;">
          <li><strong>3D Holographic Hacker Passports:</strong> Customized animated tickets with tamper-proof QR check-in codes.</li>
          <li><strong>Lightweight Link Submissions:</strong> Zero heavy uploads — supports GitHub repos, live demos, and Gamma/Loom presentations.</li>
          <li><strong>Automated Verifiable Certificates:</strong> Instant cryptographically-signed digital credentials with public verification.</li>
          <li><strong>Built-in Admin & Judging Studio:</strong> Track management, team formations, and score evaluations.</li>
        </ul>
      </div>

      <p style="font-size:13px;color:#8B84AD;line-height:1.5;">
        A GoHackerz Partner Specialist will reach out to you at <code style="color:#C6FF3D;font-family:monospace;">${proposal.contactEmail}</code> within 24–48 business hours to discuss timeline, tracks, and platform onboarding.
      </p>
    </div>
  `;

  return {
    to: proposal.contactEmail,
    subject: `⚡ We received your Hackathon Proposal: "${proposal.hackathonTitle}" [Ref: ${proposal.refNumber}]`,
    html: shell(`Proposal Received — ${proposal.hackathonTitle}`, body),
  };
}



