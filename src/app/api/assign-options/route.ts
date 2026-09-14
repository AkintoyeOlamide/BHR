import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { FULL_HR_EMAILS, ROLES, resolveEffectiveRole } from "@/lib/auth/roles";

type ProfileOption = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  manager_id: string | null;
};

async function listAuthUsersById(admin: ReturnType<typeof createAdminClient>) {
  const usersById = new Map<string, { email: string; role: string; full_name: string }>();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) return usersById;

  for (const user of data.users ?? []) {
    if (user.id && user.email) {
      const meta = (user.user_metadata ?? {}) as {
        role?: string;
        full_name?: string;
      };
      usersById.set(user.id, {
        email: user.email,
        role: (meta.role ?? ROLES.EMPLOYEE).toLowerCase(),
        full_name: meta.full_name ?? "",
      });
    }
  }

  return usersById;
}

async function fetchStaffOptions(admin: ReturnType<typeof createAdminClient>) {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, role, manager_id")
    .order("full_name");

  if (error) {
    // Fallback without manager_id / role if schema is older.
    const fallback = await admin
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (fallback.error) {
      return { data: [] as ProfileOption[], error: fallback.error };
    }
    const usersById = await listAuthUsersById(admin);
    const merged: ProfileOption[] = (fallback.data ?? []).map((profile) => {
      const authUser = usersById.get(profile.id);
      return {
        id: profile.id,
        full_name:
          profile.full_name?.trim() || authUser?.full_name || "Unknown",
        email: authUser?.email ?? "",
        role: authUser?.role ?? ROLES.EMPLOYEE,
        manager_id: null,
      };
    });
    return { data: merged, error: null };
  }

  const usersById = await listAuthUsersById(admin);

  const merged: ProfileOption[] = (profiles ?? []).map((profile) => {
    const authUser = usersById.get(profile.id);
    const role = resolveEffectiveRole(profile.role, authUser?.role);
    return {
      id: profile.id,
      full_name:
        profile.full_name?.trim() || authUser?.full_name || "Unknown",
      email: authUser?.email ?? "",
      role,
      manager_id: (profile.manager_id as string | null) ?? null,
    };
  });

  return { data: merged, error: null };
}

export async function GET() {
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isFullHrSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server admin key not configured (SUPABASE_SECRET_KEY)." },
      { status: 500 }
    );
  }

  const [staffRes, cyclesRes] = await Promise.all([
    fetchStaffOptions(admin),
    admin
      .from("appraisal_cycles")
      .select("id, title")
      .in("status", ["active", "draft"])
      .order("created_at", { ascending: false }),
  ]);

  if (staffRes.error) {
    return NextResponse.json({ error: staffRes.error.message }, { status: 500 });
  }

  const appraisers = (staffRes.data ?? [])
    .filter((profile) => profile.role === ROLES.HR_MANAGER)
    .filter((profile) => !FULL_HR_EMAILS.has((profile.email ?? "").toLowerCase()))
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email || "(no email)",
    }));

  const employees = (staffRes.data ?? [])
    .filter((profile) => profile.role === ROLES.EMPLOYEE)
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email || "(no email)",
      manager_id: profile.manager_id,
    }));

  const cycles = cyclesRes.data ?? [];

  let setupHint: string | undefined;
  if (appraisers.length === 0) {
    setupHint =
      "No managers found. Go to Managers, promote someone to Manager, then try Assign again.";
  } else if (cycles.length === 0) {
    setupHint =
      "Create a review cycle first: go to Review cycles in the menu, add one, set status to Active or Draft, then try Assign again.";
  } else if (employees.length === 0) {
    setupHint =
      "No employees found yet. Run the setup seed or add staff in the Staff tab.";
  }

  return NextResponse.json({
    appraisers,
    employees,
    cycles,
    setupRequired: Boolean(setupHint),
    setupHint,
  });
}
