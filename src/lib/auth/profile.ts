import { createClient } from "@/lib/supabase/server";
import { ROLES, type UserRole } from "./roles";

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

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (data) {
    return data as Profile;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user || user.id !== userId) return null;

  const metaRole = user.user_metadata?.role as UserRole | undefined;
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
    role: metaRole ?? ROLES.EMPLOYEE,
    department: null,
    job_title: null,
    manager_id: null,
    created_at: user.created_at,
  };
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
      email: (profile.email || user.email || "").trim(),
    },
  };
}
