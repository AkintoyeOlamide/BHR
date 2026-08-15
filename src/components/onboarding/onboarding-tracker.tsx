"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ONBOARDING_STORAGE_KEY,
  type OnboardingDepartmentProgress,
  type OnboardingLearner,
  type StoredOnboardingIdentity,
} from "@/lib/onboarding/progress";

type OnboardingTrackerContextValue = {
  ready: boolean;
  learner: OnboardingLearner | null;
  progress: OnboardingDepartmentProgress[];
  identity: StoredOnboardingIdentity | null;
  startSession: (fullName: string, email: string) => Promise<string | null>;
  trackView: (departmentId: string, lessonId: string) => Promise<void>;
  completeLesson: (departmentId: string, lessonId: string) => Promise<void>;
  departmentStatus: (departmentId: string) => "not_started" | "in_progress" | "completed";
  isLessonComplete: (departmentId: string, lessonId: string) => boolean;
  clearSession: () => void;
};

const OnboardingTrackerContext =
  createContext<OnboardingTrackerContextValue | null>(null);

function readStoredIdentity(): StoredOnboardingIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOnboardingIdentity;
    if (!parsed?.learnerId || !parsed?.email || !parsed?.fullName) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredIdentity(identity: StoredOnboardingIdentity) {
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(identity));
}

export function OnboardingTrackerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<StoredOnboardingIdentity | null>(null);
  const [learner, setLearner] = useState<OnboardingLearner | null>(null);
  const [progress, setProgress] = useState<OnboardingDepartmentProgress[]>([]);

  const applySnapshot = useCallback(
    (next: {
      learner: OnboardingLearner;
      progress: OnboardingDepartmentProgress[];
    }) => {
      setLearner(next.learner);
      setProgress(next.progress);
      const nextIdentity: StoredOnboardingIdentity = {
        learnerId: next.learner.id,
        email: next.learner.email,
        fullName: next.learner.full_name,
      };
      setIdentity(nextIdentity);
      writeStoredIdentity(nextIdentity);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const stored = readStoredIdentity();
      if (!stored) {
        if (!cancelled) setReady(true);
        return;
      }

      setIdentity(stored);
      try {
        const res = await fetch(
          `/api/onboarding/session?learnerId=${encodeURIComponent(stored.learnerId)}`
        );
        const data = await res.json();
        if (!cancelled && res.ok && data.learner) {
          applySnapshot({ learner: data.learner, progress: data.progress ?? [] });
        } else if (!cancelled) {
          window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
          setIdentity(null);
        }
      } catch {
        // Keep local identity; progress can sync later.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  const startSession = useCallback(
    async (fullName: string, email: string) => {
      const res = await fetch("/api/onboarding/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) return String(data.error ?? "Could not start session.");
      applySnapshot({ learner: data.learner, progress: data.progress ?? [] });
      return null;
    },
    [applySnapshot]
  );

  const postProgress = useCallback(
    async (
      action: "view" | "complete_lesson",
      departmentId: string,
      lessonId: string
    ) => {
      if (!identity) return;
      const res = await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          learnerId: identity.learnerId,
          email: identity.email,
          departmentId,
          lessonId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.learner) {
        applySnapshot({ learner: data.learner, progress: data.progress ?? [] });
      }
    },
    [applySnapshot, identity]
  );

  const trackView = useCallback(
    async (departmentId: string, lessonId: string) => {
      await postProgress("view", departmentId, lessonId);
    },
    [postProgress]
  );

  const completeLesson = useCallback(
    async (departmentId: string, lessonId: string) => {
      await postProgress("complete_lesson", departmentId, lessonId);
    },
    [postProgress]
  );

  const departmentStatus = useCallback(
    (departmentId: string) => {
      const row = progress.find((p) => p.department_id === departmentId);
      if (!row) return "not_started" as const;
      if (row.status === "completed") return "completed" as const;
      return "in_progress" as const;
    },
    [progress]
  );

  const isLessonComplete = useCallback(
    (departmentId: string, lessonId: string) => {
      const row = progress.find((p) => p.department_id === departmentId);
      return Boolean(row?.completed_lesson_ids.includes(lessonId));
    },
    [progress]
  );

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIdentity(null);
    setLearner(null);
    setProgress([]);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      learner,
      progress,
      identity,
      startSession,
      trackView,
      completeLesson,
      departmentStatus,
      isLessonComplete,
      clearSession,
    }),
    [
      ready,
      learner,
      progress,
      identity,
      startSession,
      trackView,
      completeLesson,
      departmentStatus,
      isLessonComplete,
      clearSession,
    ]
  );

  return (
    <OnboardingTrackerContext.Provider value={value}>
      {children}
    </OnboardingTrackerContext.Provider>
  );
}

export function useOnboardingTracker() {
  const ctx = useContext(OnboardingTrackerContext);
  if (!ctx) {
    throw new Error("useOnboardingTracker must be used within provider");
  }
  return ctx;
}
