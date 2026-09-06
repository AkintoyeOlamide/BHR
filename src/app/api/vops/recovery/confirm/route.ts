import { NextResponse } from "next/server";
import {
  consumeVopsRecoveryCode,
  findVopsRecoveryUser,
  VOPS_RECOVERY_LENGTH,
} from "@/lib/auth/vops-recovery";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfigError } from "@/lib/supabase/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const code = String(body.code ?? "")
      .trim()
      .replace(/\s+/g, "");
    const password = String(body.password ?? "");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(code) || code.length !== VOPS_RECOVERY_LENGTH) {
      return NextResponse.json(
        { error: "Enter the 4-digit code from your email." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    let otpResult;
    try {
      otpResult = await consumeVopsRecoveryCode(email, code);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (
        message.toLowerCase().includes("vops_recovery_codes") ||
        message.toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Recovery codes are not set up yet. Run 028_vops_recovery_otp.sql in Supabase.",
          },
          { status: 500 }
        );
      }
      throw err;
    }

    if (!otpResult.ok) {
      return NextResponse.json({ error: otpResult.error }, { status: 400 });
    }

    const user = await findVopsRecoveryUser(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Could not update password." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}
