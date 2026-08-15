import { OnboardingTrackerProvider } from "@/components/onboarding/onboarding-tracker";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingTrackerProvider>{children}</OnboardingTrackerProvider>;
}
