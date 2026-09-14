import { createClient } from "@/lib/supabase/server";
import { resolveEffectiveRole, type UserRole } from "./roles";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  job_title: string | null;
  manager_id: string | null;
  created_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const [{ data: profile }, { data: legacy }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("legacy_employee_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const metaRole =
    user && user.id === userId
      ? (user.user_metadata?.role as string | undefined)
      : undefined;

  const role = resolveEffectiveRole(
    profile?.role,
    legacy?.role,
    metaRole
  );

  const email = (
    (user && user.id === userId ? user.email : null) ||
    profile?.email ||
    legacy?.email ||
    ""
  )
    .trim()
    .toLowerCase();

  const fullName =
    (legacy?.full_name as string | undefined)?.trim() ||
    (profile?.full_name as string | undefined)?.trim() ||
    (user && user.id === userId
      ? (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0]
      : null) ||
    "User";

  if (profile || legacy || (user && user.id === userId)) {
    return {
      id: userId,
      email,
      full_name: fullName,
      role,
      department:
        (legacy?.department as string | null | undefined) ??
        (profile?.department as string | null | undefined) ??
        null,
      job_title:
        (legacy?.job_title as string | null | undefined) ??
        (profile?.job_title as string | null | undefined) ??
        null,
      manager_id:
        (legacy?.manager_id as string | null | undefined) ??
        (profile?.manager_id as string | null | undefined) ??
        null,
      created_at:
        (profile?.created_at as string | undefined) ||
        (legacy?.created_at as string | undefined) ||
        user?.created_at ||
        new Date().toISOString(),
    };
  }

  return null;
}

export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);
  if (!profile) return null;

  return {
    user,
    profile: {
      ...profile,
      email: (profile.email || user.email || "").trim().toLowerCase(),
    },
  };
}
