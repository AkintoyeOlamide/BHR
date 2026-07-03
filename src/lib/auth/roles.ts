export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HR_MANAGER: "hr_manager",
  EMPLOYEE: "employee",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Accounts with full admin portal access (same as super admin) */
export const FULL_HR_EMAILS = new Set(["admin@bhr.com", "hr@bhr.com"]);

export function canAccessAdmin(
  role: string | null | undefined,
  email?: string | null
) {
  if (role === ROLES.SUPER_ADMIN) return true;
  if (email && FULL_HR_EMAILS.has(email.trim().toLowerCase())) return true;
  return false;
}

export function canAccessManager(role: string | null | undefined) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.HR_MANAGER;
}

export function getHomeRouteForRole(
  role: UserRole | string | null | undefined,
  email?: string | null
) {
  if (canAccessAdmin(role, email)) return "/admin";
  if (canAccessManager(role)) return "/manager";
  return "/dashboard";
}

export function roleLabel(role: string) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return "Super Admin";
    case ROLES.HR_MANAGER:
      return "Manager";
    default:
      return "Employee";
  }
}
