import { ROLES, canAccessAdmin, FULL_HR_EMAILS } from "@/lib/auth/roles";

export { FULL_HR_EMAILS };

export function isFullHrUser(profile: {
  role: string;
  email: string;
}): boolean {
  return canAccessAdmin(profile.role, profile.email);
}

/** Resolve HR access using profile + authenticated login email */
export function isFullHrSession(session: {
  user: { email?: string | null };
  profile: { role: string; email: string };
}): boolean {
  const email = (
    session.profile.email ||
    session.user.email ||
    ""
  )
    .trim()
    .toLowerCase();

  return canAccessAdmin(session.profile.role, email);
}

export function isLineManager(profile: {
  role: string;
  email: string;
}): boolean {
  return (
    profile.role === ROLES.HR_MANAGER && !isFullHrUser(profile)
  );
}

export function canManageAppraisal(
  profile: { role: string; email: string; id: string },
  appraisal: { reviewer_id: string | null }
): boolean {
  if (isFullHrUser(profile)) return true;
  if (profile.role === ROLES.HR_MANAGER) {
    return appraisal.reviewer_id === profile.id;
  }
  return false;
}
