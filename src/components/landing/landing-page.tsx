"use client";

import { Logo } from "@/components/logo";
import { LandingHero } from "./landing-hero";
import { LandingHowItWorks } from "./landing-how-it-works";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06060f]">
      <LandingHero />
      <LandingHowItWorks />

      <footer className="border-t border-white/5 bg-[#06060f] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <Logo size="sm" theme="dark" />
          <p className="text-sm text-white/30">
            Need help? Contact your HR team.
          </p>
        </div>
      </footer>
    </div>
  );
}
