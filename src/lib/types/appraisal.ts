export type AppraisalStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed";

export type CycleStatus = "draft" | "active" | "closed";

export type AppraisalCycle = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  created_by: string | null;
  created_at: string;
};

export type Appraisal = {
  id: string;
  cycle_id: string;
  employee_id: string;
  reviewer_id: string | null;
  status: AppraisalStatus;
  job_title: string | null;
  department: string | null;
  review_period: string | null;
  goals: string | null;
  achievements: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  development_plan: string | null;
  employee_self_review: string | null;
  manager_comments: string | null;
  overall_score: number | null;
  rating_label: string | null;
  appraiser_name: string | null;
  time_in_present_position: string | null;
  kpi_section_weight: number | null;
  kpi_overall_rating: number | null;
  kpi_section_actual: number | null;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppraisalWithRelations = Appraisal & {
  employee?: { full_name: string; email: string };
  cycle?: { title: string; status: CycleStatus };
};

export const APPRAISAL_STATUS_LABELS: Record<AppraisalStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  completed: "Completed",
};

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

export const RATING_OPTIONS = [
  { score: 5, label: "Outstanding" },
  { score: 4, label: "Exceeds expectations" },
  { score: 3, label: "Meets expectations" },
  { score: 2, label: "Needs improvement" },
  { score: 1, label: "Unsatisfactory" },
];
