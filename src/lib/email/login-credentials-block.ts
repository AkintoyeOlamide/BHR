export type LoginCredentials = {
  email: string;
  password: string;
};

export function buildLoginCredentialsText(credentials: LoginCredentials) {
  return [
    "Your BHR login details:",
    `Email: ${credentials.email}`,
    `Password: ${credentials.password}`,
    "",
    "Keep this password private. A new password is generated each time HR assigns you.",
  ].join("\n");
}

export function buildLoginCredentialsHtml(credentials: LoginCredentials) {
  return `
    <div style="margin:20px 0;padding:16px;border:1px solid #ddd6fe;border-radius:12px;background:#f5f3ff">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:0.04em">
        Your login details
      </p>
      <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(credentials.email)}</p>
      <p style="margin:0 0 8px"><strong>Password:</strong> <code style="font-size:15px;color:#0f172a">${escapeHtml(credentials.password)}</code></p>
      <p style="margin:12px 0 0;font-size:13px;color:#64748b">
        Keep this password private. A new password is generated each time HR assigns you.
      </p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
