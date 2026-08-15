"use client";

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
    <OnboardingShell activeDepartmentId={activeDepartmentId} dense={dense}>
      {children}
    </OnboardingShell>
  );
}
