import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { isFullHrSession } from "@/lib/auth/hr-access";

/** Legacy route — full HR uses /admin/employees */
export default async function ManagerStaffPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");

  if (isFullHrSession(session) || canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/admin/employees");
  }

  redirect("/manager");
}
