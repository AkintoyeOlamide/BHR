"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  variant?: "light" | "dark" | "landing";
  defaultMode?: "signin" | "signup";
  onSuccess?: () => void;
};

async function signInWithApi(email: string, password: string) {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      error:
        body.error ??
        (response.status === 401
          ? "That email or password is wrong. Please try again."
          : "Could not sign in. Please try again."),
    };
  }

  return { error: null };
}

async function redirectAfterAuth(router: ReturnType<typeof useRouter>) {
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
  defaultMode = "signin",
  onSuccess,
}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isDark = variant === "dark";
  const isLanding = variant === "landing";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signin") {
        const { error } = await signInWithApi(email, password);

        if (error) {
          setMessage(error);
          return;
        }

        onSuccess?.();
        await redirectAfterAuth(router);
        return;
      }

      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!signupResponse.ok) {
        const body = await signupResponse.json().catch(() => ({}));
        setMessage(
          body.error?.includes("already been registered")
            ? "That email is already in use. Try signing in instead."
            : body.error ?? "Could not create account. Please try again."
        );
        return;
      }

      const { error } = await signInWithApi(email, password);

      if (error) {
        setMessage(error);
        return;
      }

      onSuccess?.();
      await redirectAfterAuth(router);
    } catch {
      setMessage(
        "Could not reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className={isLanding ? "space-y-3" : "space-y-4"}>
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
        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          variant={isLanding ? "landing" : variant}
        />

        {message && (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-amber-400/30 text-amber-200"
                : "border-amber-200 text-amber-800"
            }`}
          >
            {message}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={loading}
          className={
            isLanding
              ? "h-9 border-0 bg-indigo-600 text-sm font-medium text-white transition hover:bg-indigo-700"
              : isDark
                ? "border border-slate-900 text-slate-900"
                : ""
          }
        >
          {loading
            ? "One moment..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <p
        className={`text-center ${
          isLanding ? "mt-3 text-xs" : "mt-5 text-sm"
        } ${
          isDark
            ? "text-white/50"
            : isLanding
              ? "text-slate-500"
              : "text-slate-600"
        }`}
      >
        {mode === "signin" ? (
          <>
            New employee?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage(null);
              }}
              className={`font-medium transition ${
                isDark
                  ? "text-violet-300 hover:text-violet-200"
                  : isLanding
                    ? "text-[#1e3a8a] hover:text-[#2563eb]"
                    : "text-teal-600 hover:text-teal-500"
              }`}
            >
              Create account
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
              className={`font-medium transition ${
                isDark
                  ? "text-violet-300 hover:text-violet-200"
                  : isLanding
                    ? "text-[#1e3a8a] hover:text-[#2563eb]"
                    : "text-teal-600 hover:text-teal-500"
              }`}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
