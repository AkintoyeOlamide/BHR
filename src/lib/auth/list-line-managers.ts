import { createAdminClient } from "@/lib/supabase/admin";
import { FULL_HR_EMAILS, ROLES, resolveEffectiveRole } from "@/lib/auth/roles";

export type LineManagerOption = {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
};

type AuthUserInfo = {
  email: string;
  role: string;
  full_name: string;
};

async function listAuthUsersById(
  admin: ReturnType<typeof createAdminClient>
): Promise<Map<string, AuthUserInfo>> {
  const usersById = new Map<string, AuthUserInfo>();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: listed, error: listError } =
      await admin.auth.admin.listUsers({ page, perPage });
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

/**
 * Line managers staff can choose when assigning an appraisal.
 * Uses profile.role and auth metadata (whichever is Manager wins).
 */
export async function listLineManagers(options?: {
  excludeUserId?: string | null;
}): Promise<LineManagerOption[]> {
  const admin = createAdminClient();
  const excludeUserId = options?.excludeUserId ?? null;

  let profiles:
    | {
        id: string;
        full_name: string | null;
        email?: string | null;
        role?: string | null;
        department?: string | null;
      }[]
    | null = null;

  {
    const primary = await admin
      .from("profiles")
      .select("id, full_name, email, role, department")
      .order("full_name");

    if (primary.error) {
      const fallback = await admin
        .from("profiles")
        .select("id, full_name, role, department")
        .order("full_name");
      if (fallback.error) {
        throw new Error(fallback.error.message);
      }
      profiles = fallback.data;
    } else {
      profiles = primary.data;
    }
  }

  const usersById = await listAuthUsersById(admin);
  const healUpdates: PromiseLike<unknown>[] = [];
  const byId = new Map<string, LineManagerOption & { role: string }>();

  for (const profile of profiles ?? []) {
    const auth = usersById.get(profile.id);
    const email = (
      auth?.email ||
      (profile.email as string | null | undefined) ||
      ""
    )
      .trim()
      .toLowerCase();
    const role = resolveEffectiveRole(profile.role, auth?.role);
    const profileRole = (profile.role as string | null)?.trim().toLowerCase();

    if (role !== ROLES.HR_MANAGER) continue;
    if (email && FULL_HR_EMAILS.has(email)) continue;

    // Prefer the auth user id when profile.id is an orphan row.
    let managerId = profile.id;
    if (!auth && email) {
      const authMatch = [...usersById.entries()].find(
        ([, info]) => info.email === email
      );
      if (authMatch) {
        managerId = authMatch[0];
        healUpdates.push(
          admin.from("profiles").upsert({
            id: managerId,
            email,
            full_name:
              profile.full_name?.trim() ||
              authMatch[1].full_name ||
              email.split("@")[0],
            role: ROLES.HR_MANAGER,
            department: (profile.department as string | null) ?? null,
          })
        );
      } else {
        // No login account for this manager — cannot be a valid reviewer_id.
        continue;
      }
    } else if (!auth) {
      continue;
    } else if (
      profileRole !== ROLES.HR_MANAGER &&
      profileRole !== ROLES.SUPER_ADMIN
    ) {
      healUpdates.push(
        admin
          .from("profiles")
          .update({ role: ROLES.HR_MANAGER })
          .eq("id", profile.id)
      );
    }

    if (excludeUserId && managerId === excludeUserId) continue;
    if (byId.has(managerId)) continue;

    const authInfo = usersById.get(managerId);
    byId.set(managerId, {
      id: managerId,
      full_name:
        profile.full_name?.trim() ||
        authInfo?.full_name ||
        email.split("@")[0] ||
        "Unknown",
      email: authInfo?.email || email,
      department: (profile.department as string | null) ?? null,
      role,
    });
  }

  // Include auth users marked as managers even if their profile row was missing
  // from the first pass (e.g. profile without role column in older schema).
  for (const [id, auth] of usersById) {
    if (byId.has(id)) continue;
    if (auth.role !== ROLES.HR_MANAGER) continue;
    if (excludeUserId && id === excludeUserId) continue;
    if (auth.email && FULL_HR_EMAILS.has(auth.email)) continue;

    const profile = (profiles ?? []).find((row) => row.id === id);
    if (!profile) continue;

    healUpdates.push(
      admin
        .from("profiles")
        .update({ role: ROLES.HR_MANAGER })
        .eq("id", id)
    );

    byId.set(id, {
      id,
      full_name:
        profile.full_name?.trim() ||
        auth.full_name ||
        auth.email.split("@")[0] ||
        "Unknown",
      email: auth.email,
      department: (profile.department as string | null) ?? null,
      role: ROLES.HR_MANAGER,
    });
  }

  if (healUpdates.length > 0) {
    await Promise.allSettled(healUpdates);
  }

  return [...byId.values()]
    .map(({ id, full_name, email, department }) => ({
      id,
      full_name,
      email,
      department,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}
