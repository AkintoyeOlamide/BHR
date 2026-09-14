import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPasswordLoginEmail } from "@/lib/auth/roles";
import { getSupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

async function confirmEmailIfNeeded(email: string) {
  try {
    const admin = createAdminClient();
    const { data, error: listError } = await admin.auth.admin.listUsers();

    if (listError) return false;

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) return false;

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    return !error;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isPasswordLoginEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error:
            "This account signs in with an email code, not a password. Use Send code on the login page.",
        },
        { status: 400 }
      );
    }

    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const supabase = await createClient();

    let { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error?.message.toLowerCase().includes("email not confirmed")) {
      const confirmed = await confirmEmailIfNeeded(normalizedEmail);
      if (confirmed) {
        ({ error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        }));
      }
    }

    if (error) {
      const message = error.message.includes("Invalid login")
        ? "That email or password is wrong. Please try again."
        : error.message.toLowerCase().includes("fetch failed") ||
            error.message.toLowerCase().includes("timeout")
          ? "Could not reach Supabase. Check your internet connection, that the project is not paused, then try again."
          : error.message;

      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not sign in. Please try again.";
    const cause =
      err instanceof Error && err.cause instanceof Error
        ? err.cause.message
        : "";
    const isNetwork =
      message.toLowerCase().includes("fetch") ||
      message.toLowerCase().includes("timeout") ||
      cause.toLowerCase().includes("timeout") ||
      cause.toLowerCase().includes("connect");

    return NextResponse.json(
      {
        error: isNetwork
          ? "Could not reach Supabase. Check your internet connection, that the project is not paused in the Supabase dashboard, then try again."
          : message.includes("SUPABASE_NOT_CONFIGURED")
            ? "Sign-in is not connected. Check your Supabase settings in .env.local and restart the dev server."
            : "Could not sign in. Please try again.",
      },
      { status: isNetwork ? 503 : 500 }
    );
  }
}
