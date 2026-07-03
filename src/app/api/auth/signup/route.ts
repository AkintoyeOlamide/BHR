import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: email.split("@")[0],
        role: ROLES.EMPLOYEE,
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Signup failed" }, { status: 400 });
    }

    await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: email.split("@")[0],
      role: ROLES.EMPLOYEE,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 500 }
    );
  }
}
