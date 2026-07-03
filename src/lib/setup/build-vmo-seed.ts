import { ROLES } from "@/lib/auth/roles";
import type { SeedUserAccount } from "@/lib/setup/seed-users";
import { VMO_EMPLOYEE_DIRECTORY } from "@/lib/setup/vmo-employee-directory";
import {
  VMO_APPRAISER_EMAILS,
  VMO_STAFF_ACCOUNTS,
  VMO_STAFF_PASSWORD,
} from "@/lib/setup/vmo-staff";

function fullName(first: string, last: string) {
  return `${first} ${last}`.replace(/\s+/g, " ").trim();
}

/** Build deduplicated seed list: managers first, then all directory staff. */
export function buildVmoSeedAccounts(): SeedUserAccount[] {
  const managerEmails = new Set(
    VMO_APPRAISER_EMAILS.map((email) => email.toLowerCase())
  );
  const byEmail = new Map<string, SeedUserAccount>();

  for (const manager of VMO_STAFF_ACCOUNTS) {
    const email = manager.email.toLowerCase();
    byEmail.set(email, {
      email,
      password: VMO_STAFF_PASSWORD,
      full_name: manager.full_name,
      role: manager.role,
      department: manager.department,
      job_title: manager.job_title,
    });
  }

  for (const entry of VMO_EMPLOYEE_DIRECTORY) {
    const email = entry.email.trim().toLowerCase();
    if (!email || byEmail.has(email)) continue;

    byEmail.set(email, {
      email,
      password: VMO_STAFF_PASSWORD,
      full_name: fullName(entry.first_name, entry.last_name),
      role: managerEmails.has(email) ? ROLES.HR_MANAGER : ROLES.EMPLOYEE,
      department: entry.department,
      job_title: entry.job_title,
    });
  }

  return [...byEmail.values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );
}
