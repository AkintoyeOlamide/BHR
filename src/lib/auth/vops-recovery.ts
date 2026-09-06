import { createHash, randomInt } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/auth/otp";

export const VOPS_RECOVERY_LENGTH = 4;
export const VOPS_RECOVERY_TTL_MS = 10 * 60 * 1000;
export const VOPS_RECOVERY_MAX_ATTEMPTS = 5;
export const VOPS_RECOVERY_RESEND_COOLDOWN_MS = 45 * 1000;

export function hashVopsRecoveryCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

export function generateVopsRecoveryCode() {
  const max = 10 ** VOPS_RECOVERY_LENGTH;
  return String(randomInt(0, max)).padStart(VOPS_RECOVERY_LENGTH, "0");
}

export async function upsertVopsRecoveryCode(email: string, code: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  const expiresAt = new Date(Date.now() + VOPS_RECOVERY_TTL_MS).toISOString();

  const { error } = await admin.from("vops_recovery_codes").upsert(
    {
      email: normalized,
      code_hash: hashVopsRecoveryCode(normalized, code),
      attempts: 0,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) throw new Error(error.message);
  return { expiresAt };
}

export async function getRecentVopsRecoveryCreatedAt(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vops_recovery_codes")
    .select("created_at")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.created_at ? new Date(data.created_at).getTime() : null;
}

export async function consumeVopsRecoveryCode(email: string, code: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data: row, error } = await admin
    .from("vops_recovery_codes")
    .select("code_hash, attempts, expires_at")
    .eq("email", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!row) {
    return {
      ok: false as const,
      error: "Enter the code we emailed you, or request a new one.",
    };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("vops_recovery_codes").delete().eq("email", normalized);
    return {
      ok: false as const,
      error: "That code has expired. Request a new one.",
    };
  }

  if ((row.attempts ?? 0) >= VOPS_RECOVERY_MAX_ATTEMPTS) {
    await admin.from("vops_recovery_codes").delete().eq("email", normalized);
    return {
      ok: false as const,
      error: "Too many incorrect attempts. Request a new code.",
    };
  }

  const expected = hashVopsRecoveryCode(normalized, code);
  if (expected !== row.code_hash) {
    await admin
      .from("vops_recovery_codes")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("email", normalized);
    return { ok: false as const, error: "That code is incorrect. Try again." };
  }

  await admin.from("vops_recovery_codes").delete().eq("email", normalized);
  return { ok: true as const };
}

export async function findVopsRecoveryUser(email: string) {
  const normalized = email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", normalized)
    .maybeSingle();

  if (profile?.id) return { id: profile.id, email: profile.email ?? normalized };

  const authUser = await findAuthUserByEmail(normalized);
  if (!authUser) return null;
  return { id: authUser.id, email: authUser.email ?? normalized };
}
