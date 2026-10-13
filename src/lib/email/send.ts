import nodemailer from "nodemailer";
import { getEmailFrom, getSmtpConfig, isEmailConfigured } from "@/lib/email/env";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: boolean; error: string };

function createTransporter() {
  const smtp = getSmtpConfig();
  if (!smtp) return null;

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });
}

export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      ok: false,
      skipped: true,
      error:
        "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: input.from ?? getEmailFrom(),
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType,
      })),
    });

    return {
      ok: true,
      id: info.messageId,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not send email.",
    };
  }
}

export function emailIsEnabled() {
  return isEmailConfigured();
}
