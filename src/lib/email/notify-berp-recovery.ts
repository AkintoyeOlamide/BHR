import { sendEmail } from "@/lib/email/send";

export async function sendBerpRecoveryEmail(input: {
  to: string;
  code: string;
}) {
  const subject = `BERP recovery code: ${input.code}`;

  const text = [
    "Hello,",
    "",
    `Your BERP password recovery code is: ${input.code}`,
    "",
    "This code expires in 10 minutes.",
    "If you did not request this, you can ignore this email.",
    "",
    "BERP · Bitachon Enterprise",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:520px">
      <p>Hello,</p>
      <p>Your <strong>BERP</strong> password recovery code is:</p>
      <p style="font-size:32px;letter-spacing:0.35em;font-weight:700;margin:20px 0">${escapeHtml(input.code)}</p>
      <p style="color:#475569">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:14px">If you did not request this, you can ignore this email.</p>
      <p style="margin-top:24px;font-size:14px;color:#64748b">BERP · Bitachon Enterprise</p>
    </div>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
