import { OnboardingAppFrame } from "@/components/onboarding/onboarding-app-frame";
import { OnboardingWelcome } from "@/components/onboarding/onboarding-welcome";

export default function OnboardingPage() {
  return (
    <OnboardingAppFrame>
      <OnboardingWelcome />
    </OnboardingAppFrame>
  );
}
