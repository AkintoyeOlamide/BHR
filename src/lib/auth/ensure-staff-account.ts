import { createAdminClient } from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/auth/generate-password";
import { findAuthUserByEmail } from "@/lib/auth/otp";
import { ROLES, resolveEffectiveRole } from "@/lib/auth/roles";
import { VMO_EMPLOYEE_DIRECTORY } from "@/lib/setup/vmo-employee-directory";
import { VMO_APPRAISER_EMAILS } from "@/lib/setup/vmo-staff";

const APPRAISER_EMAIL_SET = new Set(
  VMO_APPRAISER_EMAILS.map((email) => email.trim().toLowerCase())
);

const DIRECTORY_BY_EMAIL = new Map(
  VMO_EMPLOYEE_DIRECTORY.map((entry) => [
    entry.email.trim().toLowerCase(),
    entry,
  ])
);

export type EnsuredStaffAccount = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created: boolean;
};

/**
 * Ensure an auth user + profile exists for a known staff email
 * (directory or existing profile) so they can sign in with OTP.
 */
export async function ensureStaffAccountForLogin(
  email: string
): Promise<EnsuredStaffAccount | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return null;

  const admin = createAdminClient();
  const directory = DIRECTORY_BY_EMAIL.get(normalized);

  let existingUser = await findAuthUserByEmail(normalized);

  // Prefer profile row if present.
  let profile: {
    id: string;
    full_name: string | null;
    role: string | null;
    department: string | null;
    job_title: string | null;
  } | null = null;

  if (existingUser) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, role, department, job_title")
      .eq("id", existingUser.id)
      .maybeSingle();
    profile = data;
  }

  if (!profile) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name, role, department, job_title, email")
      .ilike("email", normalized)
      .maybeSingle();
    if (data) {
      profile = data;
      if (!existingUser) {
        existingUser = await findAuthUserByEmail(normalized);
      }
    }
  }

  // Unknown email — not in directory and no profile.
  if (!directory && !profile && !existingUser) {
    return null;
  }

  const fullName =
    profile?.full_name?.trim() ||
    (directory
      ? `${directory.first_name} ${directory.last_name}`.trim()
      : normalized.split("@")[0]);

  const authMeta =
    existingUser && "user_metadata" in existingUser
      ? (existingUser.user_metadata as { role?: string } | undefined)
      : undefined;
  const authMetaRole = (authMeta?.role ?? "").trim();

  // Never downgrade a promoted manager when OTP login refreshes the account.
  const role = resolveEffectiveRole(
    profile?.role,
    authMetaRole,
    APPRAISER_EMAIL_SET.has(normalized) ? ROLES.HR_MANAGER : null
  );

  const department =
    profile?.department ?? directory?.department ?? null;
  const jobTitle = profile?.job_title ?? directory?.job_title ?? null;

  if (existingUser) {
    await admin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        department: department ?? undefined,
        job_title: jobTitle ?? undefined,
      },
    });

    await admin.from("profiles").upsert({
      id: existingUser.id,
      email: normalized,
      full_name: fullName,
      role,
      department,
      job_title: jobTitle,
    });

    return {
      id: existingUser.id,
      email: normalized,
      full_name: fullName,
      role,
      created: false,
    };
  }

  const password = generatePassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      department: department ?? undefined,
      job_title: jobTitle ?? undefined,
    },
  });

  if (error || !data.user) {
    throw new Error(
      error?.message ?? `Could not create account for ${normalized}`
    );
  }

  await admin.from("profiles").upsert({
    id: data.user.id,
    email: normalized,
    full_name: fullName,
    role,
    department,
    job_title: jobTitle,
  });

  return {
    id: data.user.id,
    email: normalized,
    full_name: fullName,
    role,
    created: true,
  };
}

export function isKnownStaffEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return DIRECTORY_BY_EMAIL.has(normalized);
}
