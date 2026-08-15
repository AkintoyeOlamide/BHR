import { ONBOARDING_DEPARTMENTS } from "./content";

export type OnboardingDeptStatus = "in_progress" | "completed";

export type OnboardingLearner = {
  id: string;
  full_name: string;
  email: string;
  current_department_id: string | null;
  current_lesson_id: string | null;
  last_seen_at: string;
  created_at: string;
};

export type OnboardingDepartmentProgress = {
  learner_id: string;
  department_id: string;
  status: OnboardingDeptStatus;
  completed_lesson_ids: string[];
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

export type OnboardingLearnerSnapshot = {
  learner: OnboardingLearner;
  progress: OnboardingDepartmentProgress[];
};

export const ONBOARDING_STORAGE_KEY = "berp-onboarding-learner";

export type StoredOnboardingIdentity = {
  learnerId: string;
  email: string;
  fullName: string;
};

export function departmentLessonIds(departmentId: string) {
  const dept = ONBOARDING_DEPARTMENTS.find((d) => d.id === departmentId);
  return dept?.lessons.map((l) => l.id) ?? [];
}

export function isDepartmentComplete(
  departmentId: string,
  completedLessonIds: string[]
) {
  const required = departmentLessonIds(departmentId);
  if (required.length === 0) return false;
  return required.every((id) => completedLessonIds.includes(id));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
