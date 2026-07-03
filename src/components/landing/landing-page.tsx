"use client";

import { Logo } from "@/components/logo";
import { LandingHero } from "./landing-hero";
import { LandingHowItWorks } from "./landing-how-it-works";

export function LandingPage() {
  return (
    <div className="min-h-screen text-slate-900">
      <LandingHero />
      <div className="hidden lg:block">
        <LandingHowItWorks />
      </div>

      <footer className="hidden bg-[#0b1a3d] py-6 lg:block">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-8">
          <Logo size="sm" theme="dark" />
          <p className="text-center text-xs text-blue-100/70 sm:text-sm">
            © {new Date().getFullYear()} Bitachon HR · Need help? Contact your HR
            team.
          </p>
        </div>
      </footer>
    </div>
  );
}
