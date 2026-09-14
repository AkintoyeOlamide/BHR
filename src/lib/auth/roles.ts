export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HR_MANAGER: "hr_manager",
  FACILITY_MANAGER: "facility_manager",
  EMPLOYEE: "employee",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

const ROLE_PRIORITY: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.FACILITY_MANAGER,
  ROLES.EMPLOYEE,
];

/**
 * Pick the highest-privilege role when profile and auth metadata disagree.
 * Prevents a stale `employee` profile from hiding a promoted manager.
 */
export function resolveEffectiveRole(
  ...roles: Array<string | null | undefined>
): UserRole {
  const normalized = new Set(
    roles
      .map((role) => (role ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  for (const preferred of ROLE_PRIORITY) {
    if (normalized.has(preferred)) return preferred;
  }

  return ROLES.EMPLOYEE;
}

/** Accounts with full admin portal access (same as super admin) */
export const FULL_HR_EMAILS = new Set(["admin@bhr.com", "hr@bhr.com"]);

/** Only Admin/HR use password login; everyone else uses email OTP. */
export function isPasswordLoginEmail(email?: string | null) {
  if (!email) return false;
  return FULL_HR_EMAILS.has(email.trim().toLowerCase());
}

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

export function canAccessFacility(
  role: string | null | undefined,
  email?: string | null
) {
  if (role === ROLES.FACILITY_MANAGER || role === ROLES.SUPER_ADMIN) return true;
  if (email && FULL_HR_EMAILS.has(email.trim().toLowerCase())) return true;
  return false;
}

/** BERP ops dashboard — HR admin, line managers, and facility. */
export function canAccessBerp(
  role: string | null | undefined,
  email?: string | null
) {
  if (canAccessAdmin(role, email)) return true;
  if (canAccessManager(role)) return true;
  if (canAccessFacility(role, email)) return true;
  return false;
}

export function getHomeRouteForRole(
  role: UserRole | string | null | undefined,
  email?: string | null
) {
  if (canAccessAdmin(role, email)) return "/admin";
  if (role === ROLES.FACILITY_MANAGER) return "/facility";
  if (canAccessManager(role)) return "/manager";
  return "/dashboard";
}

export function roleLabel(role: string) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return "Super Admin";
    case ROLES.HR_MANAGER:
      return "Manager";
    case ROLES.FACILITY_MANAGER:
      return "Facility Manager";
    default:
      return "Employee";
  }
}
