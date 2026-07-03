"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-[#e8edf4]">
      <div className="hidden w-1/2 flex-col justify-between bg-[#0b1a3d] p-12 text-white lg:flex">
        <Logo size="lg" theme="dark" />
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Sign in to Bitachon HR
          </h1>
          <p className="text-blue-100/80">
            Use your work email and password. Once you are in, you can see your
            review tasks and what still needs to be done.
          </p>
          <ul className="space-y-2 text-sm text-blue-100/70">
            <li>• Your review forms live here</li>
            <li>• Your progress is saved automatically</li>
            <li>• Ask HR if you get stuck</li>
          </ul>
        </div>
        <p className="text-sm text-blue-200/50">Your company HR portal</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
            <p className="mt-4 text-sm text-slate-600">
              Sign in with your work email.
            </p>
          </div>

          <div className="portal-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-600">
                Enter the details your HR team gave you.
              </p>
            </div>
            <AuthForm variant="landing" />
          </div>

          <p className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-slate-900"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
