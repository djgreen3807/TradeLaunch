/**
 * Email notification utility — sends admin alerts on form submissions.
 * Uses Namecheap Private Email SMTP (mail.privateemail.com).
 */
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "info@tradelaunch.work";

function getTransporter() {
  const host = typeof process !== "undefined" && process.env?.SMTP_HOST;
  const user = typeof process !== "undefined" && process.env?.SMTP_USER;
  const pass = typeof process !== "undefined" && process.env?.SMTP_PASS;

  console.log("[SMTP] Checking credentials:", {
    host: host || "MISSING",
    user: user || "MISSING",
    passSet: pass ? "set" : "MISSING",
  });

  if (!host || !user || !pass) {
    console.error("[SMTP] FAILED: Credentials not set — skipping email notification");
    return null;
  }

  console.log("[SMTP] Creating transport for", host, "port 465 SSL as", user);
  return nodemailer.createTransport({
    host,
    port: 465,
    secure: true, // SSL
    auth: { user, pass },
  });
}

async function sendEmail(opts: {
  subject: string;
  html: string;
}): Promise<void> {
  const transport = getTransporter();
  if (!transport) return;

  console.log("[SMTP] Sending email:", opts.subject);
  try {
    const info = await transport.sendMail({
      from: `TradeLaunch <${ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: opts.subject,
      html: opts.html,
    });
    console.log("[SMTP] SUCCESS: Email sent — messageId:", info.messageId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SMTP] FAILED:", message);
    if (err instanceof Error && "code" in err) {
      console.error("[SMTP] Error code:", (err as any).code);
    }
  }
}

export async function notifyNewJobPosting(data: {
  company_name: string;
  contact_name: string;
  email: string;
  trade: string;
  description: string;
  location: string;
  budget: string;
  phone: string;
}) {
  const html = `
    <h2 style="color:#c2410c;">New Apprenticeship Posted</h2>
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Company</td><td style="padding:6px 12px;">${escapeHtml(data.company_name)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Contact</td><td style="padding:6px 12px;">${escapeHtml(data.contact_name)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Email</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Phone</td><td style="padding:6px 12px;">${escapeHtml(data.phone || "—")}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Trade</td><td style="padding:6px 12px;"><strong>${escapeHtml(data.trade)}</strong></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Location</td><td style="padding:6px 12px;">${escapeHtml(data.location || "—")}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Budget</td><td style="padding:6px 12px;">${escapeHtml(data.budget || "—")}</td></tr>
    </table>
    <p style="color:#555;margin-top:16px;"><strong>Description:</strong><br/>${escapeHtml(data.description)}</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">
      <a href="https://www.tradelaunch.work/admin" style="color:#c2410c;">View in Admin Dashboard</a>
    </p>
  `;

  return sendEmail({
    subject: `New Apprenticeship: ${data.company_name} — ${data.trade}`,
    html,
  });
}

export async function notifyNewApplication(data: {
  full_name: string;
  email: string;
  phone: string;
  trade: string;
  experience: string;
  certifications: string;
  location: string;
  personal_statement: string;
}) {
  const html = `
    <h2 style="color:#c2410c;">New Apprentice Application</h2>
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Name</td><td style="padding:6px 12px;">${escapeHtml(data.full_name)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Email</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Phone</td><td style="padding:6px 12px;">${escapeHtml(data.phone || "—")}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Trade</td><td style="padding:6px 12px;"><strong>${escapeHtml(data.trade)}</strong></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Experience</td><td style="padding:6px 12px;">${escapeHtml(data.experience || "—")}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Certifications</td><td style="padding:6px 12px;">${escapeHtml(data.certifications || "—")}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Location</td><td style="padding:6px 12px;">${escapeHtml(data.location || "—")}</td></tr>
    </table>
    ${data.personal_statement ? `<p style="color:#555;margin-top:16px;"><strong>Personal Statement:</strong><br/>${escapeHtml(data.personal_statement)}</p>` : ""}
    <p style="color:#999;font-size:12px;margin-top:24px;">
      <a href="https://www.tradelaunch.work/admin" style="color:#c2410c;">View in Admin Dashboard</a>
    </p>
  `;

  return sendEmail({
    subject: `New Application: ${data.full_name} — ${data.trade}`,
    html,
  });
}

export async function notifyNewContact(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const html = `
    <h2 style="color:#c2410c;">New Contact Message</h2>
    <table style="border-collapse:collapse;width:100%;max-width:500px;">
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Name</td><td style="padding:6px 12px;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Email</td><td style="padding:6px 12px;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#333;">Subject</td><td style="padding:6px 12px;">${escapeHtml(data.subject)}</td></tr>
    </table>
    <p style="color:#555;margin-top:16px;"><strong>Message:</strong><br/>${escapeHtml(data.message)}</p>
    <p style="color:#999;font-size:12px;margin-top:24px;">
      <a href="https://www.tradelaunch.work/admin" style="color:#c2410c;">View in Admin Dashboard</a>
    </p>
  `;

  return sendEmail({
    subject: `Contact: ${data.subject}`,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
