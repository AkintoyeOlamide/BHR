import { createHash, randomInt } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const OTP_LENGTH = 4;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 45 * 1000;

export function hashOtpCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(0, max)).padStart(OTP_LENGTH, "0");
}

export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  // Prefer direct lookup when available.
  const adminAny = admin.auth.admin as unknown as {
    getUserByEmail?: (
      email: string
    ) => Promise<{
      data: {
        user: {
          id: string;
          email?: string;
          user_metadata?: Record<string, unknown>;
        } | null;
      };
      error: Error | null;
    }>;
  };

  if (typeof adminAny.getUserByEmail === "function") {
    const { data, error } = await adminAny.getUserByEmail(normalized);
    if (!error && data?.user) return data.user;
  }

  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const match = (data.users ?? []).find(
      (user) => (user.email ?? "").trim().toLowerCase() === normalized
    );
    if (match) return match;
    if ((data.users ?? []).length < perPage) break;
    page += 1;
  }

  return null;
}

export async function upsertLoginOtp(email: string, code: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error } = await admin.from("login_otps").upsert(
    {
      email: normalized,
      code_hash: hashOtpCode(normalized, code),
      attempts: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return { expiresAt };
}

export async function consumeLoginOtp(email: string, code: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data: row, error } = await admin
    .from("login_otps")
    .select("code_hash, attempts, expires_at, created_at")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!row) {
    return { ok: false as const, error: "Enter the code we emailed you, or request a new one." };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("login_otps").delete().eq("email", normalized);
    return { ok: false as const, error: "That code has expired. Request a new one." };
  }

  if ((row.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    await admin.from("login_otps").delete().eq("email", normalized);
    return {
      ok: false as const,
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const expected = hashOtpCode(normalized, code);
  if (expected !== row.code_hash) {
    await admin
      .from("login_otps")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("email", normalized);
    return { ok: false as const, error: "That code is incorrect. Try again." };
  }

  await admin.from("login_otps").delete().eq("email", normalized);
  return { ok: true as const };
}

export async function getRecentOtpCreatedAt(email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("login_otps")
    .select("created_at")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data?.created_at ? new Date(data.created_at).getTime() : null;
}
