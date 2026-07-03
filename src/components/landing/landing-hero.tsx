"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { AnimatedBackground } from "./animated-background";

const steps = [
  {
    number: "1",
    title: "Sign in",
    description: "Use the work email your company gave you.",
  },
  {
    number: "2",
    title: "Do your review",
    description: "When review time comes, fill in your form. It only takes a few minutes.",
  },
  {
    number: "3",
    title: "Check your status",
    description: "Come back anytime to see what is done and what is still waiting.",
  },
];

export function LandingHero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <header
        className={`relative z-10 transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
      >
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Logo theme="dark" />
          <a
            href="#how-it-works"
            className="text-sm font-medium text-white/60 transition hover:text-white"
          >
            How it works
          </a>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-6 lg:grid-cols-2 lg:gap-14 lg:pt-10">
        <div className="space-y-8">
          <div
            className={`space-y-5 transition-all duration-700 delay-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
          >
            <p className="text-sm font-medium text-violet-300">
              For every employee at your company
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              One simple place for your work reviews
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-white/60">
              BHR helps you sign in, complete your review, and see your progress.
              No confusing menus. No HR jargon.
            </p>
          </div>

          <ul
            className={`space-y-4 transition-all duration-700 delay-200 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
          >
            {steps.map((step) => (
              <li
                key={step.number}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
                  {step.number}
                </span>
                <div>
                  <p className="font-medium text-white">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/50">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`transition-all duration-700 delay-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-lg font-semibold text-white">Sign in to BHR</p>
              <p className="mt-1 text-sm text-white/50">
                Enter your work email and password below.
              </p>
            </div>

            <AuthForm variant="dark" />
          </div>

          <p className="mt-4 text-center text-sm text-white/40">
            First time here? Tap &quot;Create account&quot; inside the form.
          </p>
        </div>
      </div>
    </section>
  );
}
