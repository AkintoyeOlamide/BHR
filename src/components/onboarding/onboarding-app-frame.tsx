"use client";

import { OnboardingTrackerProvider } from "@/components/onboarding/onboarding-tracker";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

type Props = {
  children: React.ReactNode;
  activeDepartmentId?: string;
  dense?: boolean;
};

export function OnboardingAppFrame({
  children,
  activeDepartmentId,
  dense,
}: Props) {
  return (
    <OnboardingTrackerProvider>
      <OnboardingShell activeDepartmentId={activeDepartmentId} dense={dense}>
        {children}
      </OnboardingShell>
    </OnboardingTrackerProvider>
  );
}
