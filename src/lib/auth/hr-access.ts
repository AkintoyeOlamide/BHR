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

/** Can view/edit appraisal structure (HR any; line manager only if assigned). */
export function canManageAppraisal(
  profile: { role: string; email: string; id: string },
  appraisal: { reviewer_id: string | null },
  authUserId?: string | null
): boolean {
  if (isFullHrUser(profile)) return true;
  if (profile.role === ROLES.HR_MANAGER) {
    return isAssignedReviewer(profile.id, appraisal.reviewer_id, authUserId);
  }
  return false;
}

/**
 * Only the assigned manager (reviewer) may set manager ratings.
 * Full HR can view/setup appraisals but cannot enter manager ratings.
 */
export function canEditManagerRating(
  profile: { id: string },
  appraisal: { reviewer_id: string | null },
  authUserId?: string | null
): boolean {
  return isAssignedReviewer(profile.id, appraisal.reviewer_id, authUserId);
}

function isAssignedReviewer(
  profileId: string,
  reviewerId: string | null,
  authUserId?: string | null
) {
  if (!reviewerId) return false;
  if (reviewerId === profileId) return true;
  if (authUserId && reviewerId === authUserId) return true;
  return false;
}
