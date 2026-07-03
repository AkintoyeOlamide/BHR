"use client";

import { LandingBrandPanel } from "./landing-brand-panel";
import { LandingSignInPanel } from "./landing-sign-in-panel";

export function LandingHero() {
  return (
    <section className="flex min-h-screen flex-col lg:flex-row">
      <LandingBrandPanel />
      <LandingSignInPanel />
    </section>
  );
}
