import { createAdminClient } from "@/lib/supabase/admin";
import {
  isDepartmentComplete,
  normalizeEmail,
  type OnboardingDepartmentProgress,
  type OnboardingLearner,
  type OnboardingLearnerSnapshot,
} from "@/lib/onboarding/progress";

function mapLearner(row: Record<string, unknown>): OnboardingLearner {
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    current_department_id: (row.current_department_id as string | null) ?? null,
    current_lesson_id: (row.current_lesson_id as string | null) ?? null,
    last_seen_at: String(row.last_seen_at ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

function mapProgress(row: Record<string, unknown>): OnboardingDepartmentProgress {
  return {
    learner_id: String(row.learner_id),
    department_id: String(row.department_id),
    status: row.status === "completed" ? "completed" : "in_progress",
    completed_lesson_ids: Array.isArray(row.completed_lesson_ids)
      ? (row.completed_lesson_ids as string[])
      : [],
    started_at: String(row.started_at ?? ""),
    completed_at: (row.completed_at as string | null) ?? null,
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function upsertOnboardingLearner(input: {
  fullName: string;
  email: string;
}) {
  const admin = createAdminClient();
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();

  const { data: existing, error: existingError } = await admin
    .from("onboarding_learners")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await admin
      .from("onboarding_learners")
      .update({
        full_name: fullName || existing.full_name,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return mapLearner(data);
  }

  const { data, error } = await admin
    .from("onboarding_learners")
    .insert({
      full_name: fullName,
      email,
      last_seen_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapLearner(data);
}

export async function getLearnerSnapshot(
  learnerId: string
): Promise<OnboardingLearnerSnapshot | null> {
  const admin = createAdminClient();

  const { data: learner, error: learnerError } = await admin
    .from("onboarding_learners")
    .select("*")
    .eq("id", learnerId)
    .maybeSingle();

  if (learnerError) throw learnerError;
  if (!learner) return null;

  const { data: progress, error: progressError } = await admin
    .from("onboarding_department_progress")
    .select("*")
    .eq("learner_id", learnerId)
    .order("updated_at", { ascending: false });

  if (progressError) throw progressError;

  return {
    learner: mapLearner(learner),
    progress: (progress ?? []).map((row) =>
      mapProgress(row as Record<string, unknown>)
    ),
  };
}

export async function touchLearnerLocation(input: {
  learnerId: string;
  email: string;
  departmentId: string;
  lessonId: string;
}) {
  const admin = createAdminClient();
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const { data: learner, error: learnerError } = await admin
    .from("onboarding_learners")
    .select("id, email")
    .eq("id", input.learnerId)
    .maybeSingle();

  if (learnerError) throw learnerError;
  if (!learner || normalizeEmail(learner.email) !== email) {
    throw new Error("LEARNER_NOT_FOUND");
  }

  const { error: updateLearnerError } = await admin
    .from("onboarding_learners")
    .update({
      current_department_id: input.departmentId,
      current_lesson_id: input.lessonId,
      last_seen_at: now,
    })
    .eq("id", input.learnerId);

  if (updateLearnerError) throw updateLearnerError;

  const { data: existingProgress, error: existingError } = await admin
    .from("onboarding_department_progress")
    .select("*")
    .eq("learner_id", input.learnerId)
    .eq("department_id", input.departmentId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existingProgress) {
    const { error } = await admin.from("onboarding_department_progress").insert({
      learner_id: input.learnerId,
      department_id: input.departmentId,
      status: "in_progress",
      completed_lesson_ids: [],
      started_at: now,
      updated_at: now,
    });
    if (error) throw error;
  } else {
    const { error } = await admin
      .from("onboarding_department_progress")
      .update({ updated_at: now })
      .eq("learner_id", input.learnerId)
      .eq("department_id", input.departmentId);
    if (error) throw error;
  }

  return getLearnerSnapshot(input.learnerId);
}

export async function completeOnboardingLesson(input: {
  learnerId: string;
  email: string;
  departmentId: string;
  lessonId: string;
}) {
  const admin = createAdminClient();
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const { data: learner, error: learnerError } = await admin
    .from("onboarding_learners")
    .select("id, email")
    .eq("id", input.learnerId)
    .maybeSingle();

  if (learnerError) throw learnerError;
  if (!learner || normalizeEmail(learner.email) !== email) {
    throw new Error("LEARNER_NOT_FOUND");
  }

  const { data: existing, error: existingError } = await admin
    .from("onboarding_department_progress")
    .select("*")
    .eq("learner_id", input.learnerId)
    .eq("department_id", input.departmentId)
    .maybeSingle();

  if (existingError) throw existingError;

  const completed = new Set<string>(
    Array.isArray(existing?.completed_lesson_ids)
      ? (existing.completed_lesson_ids as string[])
      : []
  );
  completed.add(input.lessonId);
  const completedLessonIds = Array.from(completed);
  const done = isDepartmentComplete(input.departmentId, completedLessonIds);

  if (!existing) {
    const { error } = await admin.from("onboarding_department_progress").insert({
      learner_id: input.learnerId,
      department_id: input.departmentId,
      status: done ? "completed" : "in_progress",
      completed_lesson_ids: completedLessonIds,
      started_at: now,
      completed_at: done ? now : null,
      updated_at: now,
    });
    if (error) throw error;
  } else {
    const { error } = await admin
      .from("onboarding_department_progress")
      .update({
        status: done ? "completed" : existing.status,
        completed_lesson_ids: completedLessonIds,
        completed_at: done ? existing.completed_at ?? now : existing.completed_at,
        updated_at: now,
      })
      .eq("learner_id", input.learnerId)
      .eq("department_id", input.departmentId);
    if (error) throw error;
  }

  await admin
    .from("onboarding_learners")
    .update({
      current_department_id: input.departmentId,
      current_lesson_id: input.lessonId,
      last_seen_at: now,
    })
    .eq("id", input.learnerId);

  return getLearnerSnapshot(input.learnerId);
}

export async function listOnboardingLearners() {
  const admin = createAdminClient();

  const { data: learners, error: learnersError } = await admin
    .from("onboarding_learners")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (learnersError) throw learnersError;

  const { data: progress, error: progressError } = await admin
    .from("onboarding_department_progress")
    .select("*");

  if (progressError) throw progressError;

  const progressByLearner = new Map<string, OnboardingDepartmentProgress[]>();
  for (const row of progress ?? []) {
    const mapped = mapProgress(row as Record<string, unknown>);
    const list = progressByLearner.get(mapped.learner_id) ?? [];
    list.push(mapped);
    progressByLearner.set(mapped.learner_id, list);
  }

  return (learners ?? []).map((row) => {
    const learner = mapLearner(row as Record<string, unknown>);
    return {
      learner,
      progress: progressByLearner.get(learner.id) ?? [],
    } satisfies OnboardingLearnerSnapshot;
  });
}
