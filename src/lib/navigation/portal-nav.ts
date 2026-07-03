import { canAccessAdmin, ROLES } from "@/lib/auth/roles";

export type NavItem = {
  label: string;
  href: string;
};

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Appraisals", href: "/admin/appraisals" },
  { label: "Review cycles", href: "/admin/cycles" },
  { label: "Staff", href: "/admin/employees" },
];

export const managerNav: NavItem[] = [
  { label: "Overview", href: "/manager" },
  { label: "Appraisals", href: "/manager/appraisals" },
];

/** Full HR and super admin share the admin portal navigation */
export function getPortalNav(role: string, userEmail?: string): NavItem[] {
  if (canAccessAdmin(role, userEmail)) {
    return adminNav;
  }
  return managerNav;
}

export function getManagerNav(role: string, userEmail?: string): NavItem[] {
  return getPortalNav(role, userEmail);
}

export function getAppraisalDetailPath(role: string, appraisalId: string) {
  return `/manager/appraisals/${appraisalId}`;
}
