import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { FULL_HR_EMAILS, ROLES } from "@/lib/auth/roles";

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

  const [managersRes, employeesRes, cyclesRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("role", ROLES.HR_MANAGER)
      .order("full_name"),
    admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", ROLES.EMPLOYEE)
      .order("full_name"),
    admin
      .from("appraisal_cycles")
      .select("id, title")
      .in("status", ["active", "draft"])
      .order("created_at", { ascending: false }),
  ]);

  if (managersRes.error) {
    return NextResponse.json({ error: managersRes.error.message }, { status: 500 });
  }

  const appraisers = (managersRes.data ?? [])
    .filter((profile) => !FULL_HR_EMAILS.has(profile.email.toLowerCase()))
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
    }));

  const cycles = cyclesRes.data ?? [];

  let setupHint: string | undefined;
  if (appraisers.length === 0) {
    setupHint =
      "No managers found. Go to Staff, promote someone to Manager, then try Assign again.";
  } else if (cycles.length === 0) {
    setupHint =
      "Create a review cycle first: go to Review cycles in the menu, add one, set status to Active or Draft, then try Assign again.";
  } else if ((employeesRes.data ?? []).length === 0) {
    setupHint =
      "No employees found yet. Run the setup seed or add staff in the Staff tab.";
  }

  return NextResponse.json({
    appraisers,
    employees: employeesRes.data ?? [],
    cycles,
    setupRequired: Boolean(setupHint),
    setupHint,
  });
}
