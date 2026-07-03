"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { AnimatedBackground } from "@/components/landing/animated-background";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <Logo size="lg" theme="dark" />
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Sign in to BHR
          </h1>
          <p className="text-white/60">
            Use your work email and password. Once you are in, you can see your
            review tasks and what still needs to be done.
          </p>
          <ul className="space-y-2 text-sm text-white/50">
            <li>• Your review forms live here</li>
            <li>• Your progress is saved automatically</li>
            <li>• Ask HR if you get stuck</li>
          </ul>
        </div>
        <p className="text-sm text-white/30">Your company HR portal</p>
      </div>

      <div className="relative z-10 flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo theme="dark" />
            <p className="mt-4 text-sm text-white/50">
              Sign in with your work email.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Sign in</h2>
              <p className="mt-1 text-sm text-white/50">
                Enter the details your HR team gave you.
              </p>
            </div>
            <AuthForm variant="dark" />
          </div>

          <p className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-white/40 transition hover:text-white/70"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
