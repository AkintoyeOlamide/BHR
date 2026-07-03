import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
        : error.message;

      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not sign in. Please try again.";

    return NextResponse.json(
      {
        error:
          message.includes("SUPABASE_NOT_CONFIGURED") ||
          message.includes("fetch")
            ? "Sign-in is not connected. Check your Supabase settings in .env.local and restart the dev server."
            : "Could not sign in. Please try again.",
      },
      { status: 500 }
    );
  }
}
