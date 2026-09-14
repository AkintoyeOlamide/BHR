export const FACILITY_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type FacilityPriority = (typeof FACILITY_PRIORITIES)[number];

export const FACILITY_STATUSES = [
  "reported",
  "in_progress",
  "awaiting_confirm",
  "resolved",
] as const;

export type FacilityStatus = (typeof FACILITY_STATUSES)[number];

export type FacilityReport = {
  id: string;
  reporter_name: string;
  reporter_email: string;
  department: string;
  location: string;
  issue_title: string;
  how_it_spoilt: string;
  occurred_at: string;
  priority: FacilityPriority;
  status: FacilityStatus;
  photo_urls: string[];
  facility_notes: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  assignment_note: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  fix_token: string | null;
  fix_note: string | null;
  fix_photo_urls: string[];
  fix_submitted_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
};

export const FACILITY_PRIORITY_LABELS: Record<FacilityPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const FACILITY_STATUS_LABELS: Record<FacilityStatus, string> = {
  reported: "Reported",
  in_progress: "In progress",
  awaiting_confirm: "Awaiting confirm",
  resolved: "Resolved",
};

export const FACILITY_DEPARTMENTS = [
  "Comms & IT",
  "Operations",
  "Finance",
  "HR",
  "Admin",
  "Security",
  "Other",
] as const;
