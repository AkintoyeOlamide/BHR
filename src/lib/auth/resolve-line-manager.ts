import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/auth/otp";
import { FULL_HR_EMAILS, ROLES, resolveEffectiveRole } from "@/lib/auth/roles";

export type ResolvedLineManager = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

/**
 * Resolve a selected manager id to a reviewer_id that satisfies
 * appraisals.reviewer_id → profiles(id), with a matching auth user.
 * Repairs orphan profile / auth mismatches when possible.
 */
export async function resolveLineManagerReviewer(
  requestedId: string
): Promise<
  | { ok: true; manager: ResolvedLineManager }
  | { ok: false; error: string }
> {
  const admin = createAdminClient();
  const id = requestedId.trim();
  if (!id) {
    return { ok: false, error: "Select your manager before assigning." };
  }

  const { data: profileById } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", id)
    .maybeSingle();

  const authById = await admin.auth.admin.getUserById(id);
  const authUser = authById.data.user ?? null;

  // Happy path: profile + auth share the same id.
  if (profileById && authUser) {
    const email = (authUser.email ?? "").trim().toLowerCase();
    const role = resolveEffectiveRole(
      profileById.role,
      (authUser.user_metadata as { role?: string } | undefined)?.role
    );

    if (!email) {
      return {
        ok: false,
        error: "Your selected manager has no email address on file.",
      };
    }
    if (FULL_HR_EMAILS.has(email)) {
      return {
        ok: false,
        error: "Please select a line manager, not the HR admin account.",
      };
    }
    if (role !== ROLES.HR_MANAGER) {
      return {
        ok: false,
        error:
          "That person is not a manager. Choose someone from the manager list.",
      };
    }

    // Keep profile role in sync for future list/filter queries.
    if ((profileById.role as string | null)?.toLowerCase() !== ROLES.HR_MANAGER) {
      await admin
        .from("profiles")
        .update({ role: ROLES.HR_MANAGER, email })
        .eq("id", id);
    }

    return {
      ok: true,
      manager: {
        id,
        full_name:
          profileById.full_name?.trim() ||
          (
            (authUser.user_metadata as { full_name?: string } | undefined)
              ?.full_name ?? ""
          ).trim() ||
          email.split("@")[0],
        email,
        role: ROLES.HR_MANAGER,
      },
    };
  }

  // Profile exists but auth user for that id is missing — find auth by email.
  const profileEmail = (
    (profileById?.email as string | null | undefined) ?? ""
  )
    .trim()
    .toLowerCase();

  if (profileById && !authUser && profileEmail) {
    const authByEmail = await findAuthUserByEmail(profileEmail);
    if (authByEmail?.id) {
      const email = (authByEmail.email ?? profileEmail).trim().toLowerCase();
      const meta = (authByEmail as { user_metadata?: { role?: string; full_name?: string } })
        .user_metadata;

      if (FULL_HR_EMAILS.has(email)) {
        return {
          ok: false,
          error: "Please select a line manager, not the HR admin account.",
        };
      }

      const fullName =
        profileById.full_name?.trim() ||
        meta?.full_name?.trim() ||
        email.split("@")[0];

      // Ensure the live auth user has a profile row (required by reviewer_id FK).
      const { error: upsertError } = await admin.from("profiles").upsert({
        id: authByEmail.id,
        email,
        full_name: fullName,
        role: ROLES.HR_MANAGER,
      });

      if (upsertError) {
        return {
          ok: false,
          error: `Could not repair manager profile: ${upsertError.message}`,
        };
      }

      await admin.auth.admin.updateUserById(authByEmail.id, {
        user_metadata: {
          ...(meta ?? {}),
          role: ROLES.HR_MANAGER,
          full_name: fullName,
        },
      });

      return {
        ok: true,
        manager: {
          id: authByEmail.id,
          full_name: fullName,
          email,
          role: ROLES.HR_MANAGER,
        },
      };
    }
  }

  // Auth exists but profile row missing — create it.
  if (authUser && !profileById) {
    const email = (authUser.email ?? "").trim().toLowerCase();
    const meta = authUser.user_metadata as
      | { role?: string; full_name?: string }
      | undefined;
    const role = resolveEffectiveRole(meta?.role);
    if (!email) {
      return {
        ok: false,
        error: "Your selected manager has no email address on file.",
      };
    }
    if (FULL_HR_EMAILS.has(email)) {
      return {
        ok: false,
        error: "Please select a line manager, not the HR admin account.",
      };
    }
    if (role !== ROLES.HR_MANAGER) {
      return {
        ok: false,
        error:
          "That person is not a manager. Choose someone from the manager list.",
      };
    }

    const fullName =
      meta?.full_name?.trim() || email.split("@")[0];

    const { error: upsertError } = await admin.from("profiles").upsert({
      id: authUser.id,
      email,
      full_name: fullName,
      role: ROLES.HR_MANAGER,
    });

    if (upsertError) {
      return {
        ok: false,
        error: `Could not create manager profile: ${upsertError.message}`,
      };
    }

    return {
      ok: true,
      manager: {
        id: authUser.id,
        full_name: fullName,
        email,
        role: ROLES.HR_MANAGER,
      },
    };
  }

  return {
    ok: false,
    error:
      "Selected manager account is incomplete (missing login or profile). Ask HR to open Managers and promote them again.",
  };
}
