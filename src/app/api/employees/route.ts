import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { FULL_HR_EMAILS, ROLES, resolveEffectiveRole } from "@/lib/auth/roles";
import { VMO_EMPLOYEE_DIRECTORY } from "@/lib/setup/vmo-employee-directory";

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

async function listAuthUsersById(admin: ReturnType<typeof createAdminClient>) {
  const usersById = new Map<
    string,
    { email: string; role: string; full_name: string }
  >();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: listed, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listError) {
      throw new Error(listError.message);
    }
    for (const user of listed.users ?? []) {
      const meta = (user.user_metadata ?? {}) as {
        role?: string;
        full_name?: string;
      };
      usersById.set(user.id, {
        email: (user.email ?? "").trim().toLowerCase(),
        role: (meta.role ?? ROLES.EMPLOYEE).toLowerCase(),
        full_name: (meta.full_name ?? "").trim(),
      });
    }
    if ((listed.users ?? []).length < perPage) break;
    page += 1;
  }
  return usersById;
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
  let profiles:
    | {
        id: string;
        full_name: string | null;
        role?: string | null;
        manager_id?: string | null;
        department?: string | null;
        job_title?: string | null;
      }[]
    | null = null;

  {
    const primary = await admin
      .from("profiles")
      .select("id, full_name, role, manager_id, department, job_title")
      .order("full_name");

    if (primary.error) {
      const fallback = await admin
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (fallback.error) {
        return NextResponse.json(
          { error: fallback.error.message },
          { status: 500 }
        );
      }
      profiles = fallback.data;
    } else {
      profiles = primary.data;
    }
  }

  let usersById: Map<string, { email: string; role: string; full_name: string }>;
  try {
    usersById = await listAuthUsersById(admin);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not list users." },
      { status: 500 }
    );
  }

  const directoryByEmail = new Map(
    VMO_EMPLOYEE_DIRECTORY.map((entry) => [
      entry.email.trim().toLowerCase(),
      entry,
    ])
  );

  const nameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.full_name?.trim() ||
        usersById.get(profile.id)?.full_name ||
        "Unknown",
    ])
  );

  const employees = (profiles ?? []).map((profile) => {
    const auth = usersById.get(profile.id);
    const email = auth?.email ?? "";
    const directory = email ? directoryByEmail.get(email) : undefined;
    const role = resolveEffectiveRole(profile.role, auth?.role);
    const managerId = (profile.manager_id as string | null) ?? null;

    return {
      id: profile.id,
      full_name:
        profile.full_name?.trim() ||
        auth?.full_name ||
        email.split("@")[0] ||
        "Unknown",
      email,
      role,
      department:
        (profile.department as string | null) ??
        directory?.department ??
        null,
      job_title:
        (profile.job_title as string | null) ?? directory?.job_title ?? null,
      manager_id: managerId,
      manager_name: managerId ? nameById.get(managerId) ?? null : null,
    };
  });

  return NextResponse.json({ employees });
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
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id, full_name, role, manager_id")
    .eq("id", body.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Staff member not found." },
      { status: 404 }
    );
  }

  const authUserRes = await admin.auth.admin.getUserById(body.id);
  const authEmail =
    authUserRes.data.user?.email?.toLowerCase() ?? body.email ?? "";
  const authMeta = (authUserRes.data.user?.user_metadata ?? {}) as {
    role?: string;
    full_name?: string;
    department?: string;
    job_title?: string;
  };

  const wantsRoleChange =
    typeof body.role === "string" && body.role.trim().length > 0;

  // --- Role change (must run before manager_id — clients often spread the whole member) ---
  if (wantsRoleChange) {
    const newRole = (body.role as string).trim().toLowerCase();

    if (!canChangeRole(session, authEmail, newRole)) {
      return NextResponse.json(
        { error: "You cannot change this account to that role." },
        { status: 403 }
      );
    }

    const fullName = body.full_name ?? existing.full_name;

    // Prefer the live auth account when the staff row is an orphan profile.
    let targetId = body.id as string;
    if (!authUserRes.data.user && authEmail) {
      const { findAuthUserByEmail } = await import("@/lib/auth/otp");
      const authByEmail = await findAuthUserByEmail(authEmail);
      if (authByEmail?.id) {
        targetId = authByEmail.id;
        await admin.from("profiles").upsert({
          id: targetId,
          email: authEmail,
          full_name: fullName,
          role: newRole,
          department: body.department ?? null,
          job_title: body.job_title ?? null,
        });
      }
    }

    const { data: updatedProfile, error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        role: newRole,
        ...(authEmail ? { email: authEmail } : {}),
      })
      .eq("id", targetId)
      .select("id, role")
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!updatedProfile || (updatedProfile.role as string)?.toLowerCase() !== newRole) {
      // Insert if update matched no row (e.g. repaired onto a new auth id).
      const { data: upserted, error: upsertError } = await admin
        .from("profiles")
        .upsert({
          id: targetId,
          email: authEmail || null,
          full_name: fullName,
          role: newRole,
          department: body.department ?? null,
          job_title: body.job_title ?? null,
        })
        .select("id, role")
        .maybeSingle();

      if (upsertError || !upserted) {
        return NextResponse.json(
          {
            error:
              upsertError?.message ??
              "Role was not saved on the profile. Check the profiles.role column / migrations.",
          },
          { status: 500 }
        );
      }
    }

    // If demoted from manager, clear staff who reported to them.
    if (newRole === ROLES.EMPLOYEE) {
      await admin
        .from("profiles")
        .update({ manager_id: null })
        .eq("manager_id", targetId);
      if (targetId !== body.id) {
        await admin
          .from("profiles")
          .update({ manager_id: null })
          .eq("manager_id", body.id);
      }
    }

    if (authUserRes.data.user || targetId) {
      await admin.auth.admin.updateUserById(targetId, {
        user_metadata: {
          ...authMeta,
          role: newRole,
          full_name: fullName,
          department: body.department ?? authMeta.department,
          job_title: body.job_title ?? authMeta.job_title,
        },
      });
    }

    return NextResponse.json({ ok: true, role: newRole, id: targetId });
  }

  // --- Assign / clear line manager ---
  if ("manager_id" in body) {
    const managerId =
      body.manager_id === null || body.manager_id === ""
        ? null
        : String(body.manager_id);

    if (managerId === existing.id) {
      return NextResponse.json(
        { error: "A person cannot be their own manager." },
        { status: 400 }
      );
    }

    if (managerId) {
      const { data: managerProfile } = await admin
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", managerId)
        .maybeSingle();

      if (!managerProfile) {
        return NextResponse.json(
          { error: "Selected manager was not found." },
          { status: 400 }
        );
      }

      const managerAuth = await admin.auth.admin.getUserById(managerId);
      const managerEmail = (
        managerAuth.data.user?.email ?? ""
      ).toLowerCase();
      const managerRole = resolveEffectiveRole(
        managerProfile.role,
        (
          managerAuth.data.user?.user_metadata as { role?: string } | undefined
        )?.role
      );

      const isManagerRole =
        managerRole === ROLES.HR_MANAGER ||
        managerRole === ROLES.SUPER_ADMIN;
      const isFullHrEmail = FULL_HR_EMAILS.has(managerEmail);

      if (!isManagerRole || isFullHrEmail) {
        return NextResponse.json(
          {
            error:
              "Assign staff to a line manager account (not HR admin). Promote the person to Manager first.",
          },
          { status: 400 }
        );
      }

      const { error: assignError } = await admin
        .from("profiles")
        .update({ manager_id: managerId })
        .eq("id", existing.id);

      if (assignError) {
        return NextResponse.json(
          { error: assignError.message },
          { status: 500 }
        );
      }

      // Keep open appraisals aligned with the org manager.
      await admin
        .from("appraisals")
        .update({
          reviewer_id: managerId,
          appraiser_name: managerProfile.full_name,
        })
        .eq("employee_id", existing.id)
        .in("status", ["not_started", "in_progress", "submitted"]);

      return NextResponse.json({
        ok: true,
        manager_id: managerId,
        manager_name: managerProfile.full_name,
      });
    }

    const { error: clearError } = await admin
      .from("profiles")
      .update({ manager_id: null })
      .eq("id", existing.id);

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, manager_id: null });
  }

  return NextResponse.json(
    { error: "Nothing to update. Provide role or manager_id." },
    { status: 400 }
  );
}
