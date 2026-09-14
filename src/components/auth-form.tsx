"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isPasswordLoginEmail } from "@/lib/auth/roles";

type AuthFormProps = {
  variant?: "light" | "dark" | "landing";
  onSuccess?: () => void;
  /** After sign-in, go here instead of the role home (e.g. /berp). */
  nextPath?: string | null;
};

type Step = "email" | "password" | "otp";
type LoginMode = "staff" | "admin";

function safeNextPath(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

async function redirectAfterAuth(
  router: ReturnType<typeof useRouter>,
  nextPath?: string | null
) {
  const safeNext = safeNextPath(nextPath);
  if (safeNext) {
    router.push(safeNext);
    router.refresh();
    return;
  }
  const response = await fetch("/api/auth/profile");
  if (response.ok) {
    const data = await response.json();
    router.push(data.home ?? "/dashboard");
  } else {
    router.push("/dashboard");
  }
  router.refresh();
}

export function AuthForm({
  variant = "light",
  onSuccess,
  nextPath,
}: AuthFormProps) {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>("staff");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isDark = variant === "dark";
  const isLanding = variant === "landing";
  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email]
  );

  function switchToAdminLogin() {
    setLoginMode("admin");
    setStep("password");
    setMessage(null);
    setInfo(null);
    setCode("");
  }

  function switchToStaffLogin() {
    setLoginMode("staff");
    setStep("email");
    setPassword("");
    setMessage(null);
    setInfo(null);
    setCode("");
  }

  async function requestCode(targetEmail: string) {
    const response = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: body.error ?? "Could not send login code." };
    }
    if (body.method === "password") {
      return { method: "password" as const };
    }
    return {
      method: "otp" as const,
      message: body.message ?? "We sent a 4-digit code to your email.",
    };
  }

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setInfo(null);

    try {
      if (!normalizedEmail.includes("@")) {
        setMessage("Enter a valid work email.");
        return;
      }

      if (isPasswordLoginEmail(normalizedEmail)) {
        setLoginMode("admin");
        setStep("password");
        return;
      }

      const result = await requestCode(normalizedEmail);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      if (result.method === "password") {
        setLoginMode("admin");
        setStep("password");
        return;
      }
      setInfo(result.message ?? null);
      setStep("otp");
      setCode("");
    } catch {
      setMessage("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(
          body.error ??
            (response.status === 401
              ? "That email or password is wrong. Please try again."
              : "Could not sign in. Please try again.")
        );
        return;
      }
      onSuccess?.();
      await redirectAfterAuth(router, nextPath);
    } catch {
      setMessage("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error ?? "Could not verify that code.");
        return;
      }
      onSuccess?.();
      await redirectAfterAuth(router, nextPath);
    } catch {
      setMessage("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setLoading(true);
    setMessage(null);
    setInfo(null);
    try {
      const result = await requestCode(normalizedEmail);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setInfo(result.message ?? "We sent a new code to your email.");
    } catch {
      setMessage("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const alertClass = isDark
    ? "border-amber-400/30 text-amber-200"
    : "border-amber-200 text-amber-800";
  const infoClass = isDark
    ? "border-emerald-400/30 text-emerald-200"
    : "border-emerald-200 text-emerald-800";
  const buttonClass = isLanding
    ? "h-11 border-0 bg-indigo-600 text-base font-medium text-white transition hover:bg-indigo-700"
    : isDark
      ? "border border-slate-900 text-slate-900"
      : "";
  const mutedClass = isDark
    ? "text-white/50"
    : isLanding
      ? "text-slate-500"
      : "text-slate-600";
  const linkClass = isDark
    ? "text-violet-300 hover:text-violet-200"
    : isLanding
      ? "text-[#1e3a8a] hover:text-[#2563eb]"
      : "text-teal-600 hover:text-teal-500";

  return (
    <div>
      {loginMode === "staff" && step === "email" && (
        <form onSubmit={handleContinue} className="space-y-4">
          <Input
            label="Work email"
            type="email"
            placeholder="name@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            variant={isLanding ? "landing" : variant}
          />
          <p className={`text-xs leading-relaxed ${mutedClass}`}>
            Staff: enter your work email and we send a 4-digit code — no password
            needed.
          </p>
          {message && (
            <p className={`rounded-xl border px-4 py-3 text-sm ${alertClass}`}>
              {message}
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className={buttonClass}
          >
            {loading ? "One moment…" : "Continue"}
          </Button>
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={switchToAdminLogin}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                isDark
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin / HR sign in
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          {loginMode === "admin" && (
            <p className={`text-xs leading-relaxed ${mutedClass}`}>
              Admin and HR accounts sign in with email and password.
            </p>
          )}
          <Input
            label="Work email"
            type="email"
            placeholder="admin@bhr.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={loginMode === "staff" && Boolean(normalizedEmail)}
            required
            autoComplete="email"
            variant={isLanding ? "landing" : variant}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
            variant={isLanding ? "landing" : variant}
          />
          {message && (
            <p className={`rounded-xl border px-4 py-3 text-sm ${alertClass}`}>
              {message}
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className={buttonClass}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className={`text-center text-sm ${mutedClass}`}>
            {loginMode === "admin" ? (
              <button
                type="button"
                className={`font-medium transition ${linkClass}`}
                onClick={switchToStaffLogin}
              >
                ← Staff sign in with email code
              </button>
            ) : (
              <button
                type="button"
                className={`font-medium transition ${linkClass}`}
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setMessage(null);
                }}
              >
                Use a different email
              </button>
            )}
          </p>
        </form>
      )}

      {loginMode === "staff" && step === "otp" && (
        <form onSubmit={handleOtpVerify} className="space-y-4">
          <Input
            label="Work email"
            type="email"
            value={normalizedEmail}
            readOnly
            variant={isLanding ? "landing" : variant}
          />
          <Input
            label="4-digit code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="1234"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            required
            autoComplete="one-time-code"
            variant={isLanding ? "landing" : variant}
          />
          {info && (
            <p className={`rounded-xl border px-4 py-3 text-sm ${infoClass}`}>
              {info}
            </p>
          )}
          {message && (
            <p className={`rounded-xl border px-4 py-3 text-sm ${alertClass}`}>
              {message}
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            disabled={loading || code.length !== 4}
            className={buttonClass}
          >
            {loading ? "Verifying…" : "Sign in with code"}
          </Button>
          <div className={`flex flex-wrap items-center justify-center gap-3 text-sm ${mutedClass}`}>
            <button
              type="button"
              disabled={loading}
              className={`font-medium transition ${linkClass}`}
              onClick={handleResendCode}
            >
              Resend code
            </button>
            <span aria-hidden>·</span>
            <button
              type="button"
              className={`font-medium transition ${linkClass}`}
              onClick={() => {
                switchToStaffLogin();
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
