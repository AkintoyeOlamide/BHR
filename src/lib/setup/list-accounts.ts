import type { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/auth/roles";

export type AccountOption = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

export function isMissingTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("could not find the table")
  );
}

/** Load accounts from public.profiles when the table exists. */
export async function listProfileAccounts(
  admin: AdminClient
): Promise<AccountOption[] | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name");

  if (error) {
    if (isMissingTableError(error.message)) return null;
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email.toLowerCase(),
    role: row.role,
  }));
}

/** Fallback: load accounts from Supabase Auth when profiles table is missing. */
export async function listAuthAccounts(
  admin: AdminClient
): Promise<AccountOption[]> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    throw new Error(error.message);
  }

  return (data.users ?? []).map((user) => ({
    id: user.id,
    email: (user.email ?? "").toLowerCase(),
    full_name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "User",
    role: (user.user_metadata?.role as string | undefined) ?? ROLES.EMPLOYEE,
  }));
}

export async function resolveAccountDirectory(admin: AdminClient) {
  const fromProfiles = await listProfileAccounts(admin);
  if (fromProfiles) {
    return { accounts: fromProfiles, source: "profiles" as const };
  }

  const fromAuth = await listAuthAccounts(admin);
  return { accounts: fromAuth, source: "auth" as const };
}
