import type { AppraisalStatus } from "@/lib/types/appraisal";

export function appraisalStatusBadgeClass(status: AppraisalStatus | string): string {
  switch (status) {
    case "not_started":
    case "in_progress":
      return "portal-badge portal-badge--amber";
    case "submitted":
      return "portal-badge portal-badge--sky";
    case "completed":
      return "portal-badge portal-badge--emerald";
    default:
      return "portal-badge portal-badge--slate";
  }
}
