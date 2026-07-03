import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { ROLES } from "@/lib/auth/roles";

function canAccessStaffApi(
  session: NonNullable<Awaited<ReturnType<typeof requireProfile>>>
) {
  return isFullHrSession(session);
}

function canChangeRole(
  session: NonNullable<Awaited<ReturnType<typeof requireProfile>>>,
  targetEmail: string,
  newRole: string
) {
  if (!isFullHrSession(session)) return false;

  const email = targetEmail.toLowerCase();
  if (email === "hr@bhr.com" || email === "admin@bhr.com") return false;

  return (
    newRole === ROLES.EMPLOYEE ||
    newRole === ROLES.HR_MANAGER ||
    newRole === ROLES.SUPER_ADMIN
  );
}

export async function GET() {
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessStaffApi(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ employees: data });
}

export async function PATCH(request: Request) {
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessStaffApi(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const newRole = body.role as string;

  if (!canChangeRole(session, body.email ?? "", newRole)) {
    return NextResponse.json(
      { error: "You cannot change this account to that role." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("email, role")
    .eq("id", body.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  if (!canChangeRole(session, existing.email, newRole)) {
    return NextResponse.json(
      { error: "You cannot change this account." },
      { status: 403 }
    );
  }

  const { data, error } = await admin
    .from("profiles")
    .update({
      role: newRole,
      full_name: body.full_name,
      department: body.department,
      job_title: body.job_title,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.auth.admin.updateUserById(body.id, {
    user_metadata: { role: newRole, full_name: body.full_name },
  });

  return NextResponse.json({ employee: data });
}
