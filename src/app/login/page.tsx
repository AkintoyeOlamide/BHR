"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo size="lg" theme="dark" />
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-white">
            Welcome to BHR
          </h1>
          <p className="mt-4 text-slate-300">
            Sign in to manage appraisals, review cycles, and your team — all in
            one place.
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Built for modern HR teams
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "signin"
              ? "Enter your credentials to access BHR."
              : "Set up your account to get started."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />

            {message && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {message}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage(null);
                  }}
                  className="font-medium text-teal-600 hover:text-teal-500"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setMessage(null);
                  }}
                  className="font-medium text-teal-600 hover:text-teal-500"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-slate-700"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
