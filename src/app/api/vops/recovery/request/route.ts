import { NextResponse } from "next/server";
import {
  generateVopsRecoveryCode,
  getRecentVopsRecoveryCreatedAt,
  findVopsRecoveryUser,
  upsertVopsRecoveryCode,
  VOPS_RECOVERY_RESEND_COOLDOWN_MS,
} from "@/lib/auth/vops-recovery";
import { sendVopsRecoveryEmail } from "@/lib/email/notify-vops-recovery";
import { getSupabaseConfigError } from "@/lib/supabase/env";

const genericOk = {
  ok: true,
  message: "If that email is registered, a code was sent.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 }
      );
    }

    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const user = await findVopsRecoveryUser(email);
    // Do not reveal whether the email exists.
    if (!user) {
      return NextResponse.json(genericOk);
    }

    const recentCreatedAt = await getRecentVopsRecoveryCreatedAt(email);
    if (
      recentCreatedAt &&
      Date.now() - recentCreatedAt < VOPS_RECOVERY_RESEND_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (VOPS_RECOVERY_RESEND_COOLDOWN_MS - (Date.now() - recentCreatedAt)) /
          1000
      );
      return NextResponse.json(
        { error: `Please wait ${waitSec}s before requesting another code.` },
        { status: 429 }
      );
    }

    const code = generateVopsRecoveryCode();

    try {
      await upsertVopsRecoveryCode(email, code);
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

    const emailResult = await sendVopsRecoveryEmail({ to: email, code });
    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error:
            "skipped" in emailResult && emailResult.skipped
              ? "Email is not configured on BHR. Set SMTP_* on Vercel."
              : emailResult.error ?? "Could not send recovery code.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(genericOk);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not send recovery code. Please try again.",
      },
      { status: 500 }
    );
  }
}
