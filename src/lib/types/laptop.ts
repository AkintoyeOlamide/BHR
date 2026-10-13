export const LAPTOP_DEPARTMENTS = [
  "Admin",
  "AGRO",
  "CEO'S Office",
  "CHL",
  "Commercial",
  "Comms & IT",
  "CSE",
  "Executive Leadership",
  "Finance",
  "HR",
  "Internal Control",
  "Legal",
  "Maintenance",
  "Operations",
  "Quality & Safety",
  "Other",
] as const;

export type LaptopDepartment = (typeof LAPTOP_DEPARTMENTS)[number];

export function isAllowedLaptopDepartment(value: string) {
  const department = value.trim();
  if (!department || department === "Other" || department.length > 80) {
    return false;
  }
  if ((LAPTOP_DEPARTMENTS as readonly string[]).includes(department)) {
    return true;
  }
  return department.length >= 2;
}

export const LAPTOP_REQUEST_STATUSES = [
  "requested",
  "in_review",
  "approved",
  "fulfilled",
  "declined",
] as const;

export type LaptopRequestStatus = (typeof LAPTOP_REQUEST_STATUSES)[number];

export const LAPTOP_REQUEST_STATUS_LABELS: Record<LaptopRequestStatus, string> =
  {
    requested: "Requested",
    in_review: "In review",
    approved: "Approved",
    fulfilled: "Fulfilled",
    declined: "Declined",
  };

export const LAPTOP_SPEC_PRESETS = [
  '14" · 16GB RAM · 512GB SSD',
  '15" · 16GB RAM · 512GB SSD',
  '14" · 32GB RAM · 1TB SSD',
  "Light travel laptop",
  "High-performance / engineering",
] as const;

export type LaptopRequest = {
  id: string;
  full_name: string;
  email: string;
  department: string;
  reason: string;
  preferred_spec: string;
  currently_has_laptop: boolean;
  status: LaptopRequestStatus;
  created_at: string;
  updated_at: string;
};
