import { NextResponse } from "next/server";
import { isPasswordLoginEmail } from "@/lib/auth/roles";
import { ensureStaffAccountForLogin } from "@/lib/auth/ensure-staff-account";
import {
  generateOtpCode,
  getRecentOtpCreatedAt,
  OTP_RESEND_COOLDOWN_MS,
  upsertLoginOtp,
} from "@/lib/auth/otp";
import { sendLoginOtpEmail } from "@/lib/email/notify-login-otp";
import { getSupabaseConfigError } from "@/lib/supabase/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid work email." },
        { status: 400 }
      );
    }

    if (isPasswordLoginEmail(email)) {
      return NextResponse.json({
        ok: true,
        method: "password" as const,
      });
    }

    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    let account;
    try {
      account = await ensureStaffAccountForLogin(email);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not prepare your account for login.",
        },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json(
        {
          error:
            "No staff record found for that email. Ask HR to add you to the directory.",
        },
        { status: 404 }
      );
    }

    const recentCreatedAt = await getRecentOtpCreatedAt(email);
    if (
      recentCreatedAt &&
      Date.now() - recentCreatedAt < OTP_RESEND_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (Date.now() - recentCreatedAt)) / 1000
      );
      return NextResponse.json(
        {
          error: `Please wait ${waitSec}s before requesting another code.`,
        },
        { status: 429 }
      );
    }

    const code = generateOtpCode();

    try {
      await upsertLoginOtp(email, code);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (
        message.toLowerCase().includes("login_otps") ||
        message.toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json(
          {
            error:
              "Login codes are not set up yet. Ask admin to run migration 013_login_otps.sql in Supabase.",
          },
          { status: 500 }
        );
      }
      throw err;
    }

    const emailResult = await sendLoginOtpEmail({
      to: email,
      code,
      name: account.full_name,
    });

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error:
            "skipped" in emailResult && emailResult.skipped
              ? "Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS."
              : emailResult.error ?? "Could not send login code.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      method: "otp" as const,
      message: "We sent a 4-digit code to your email.",
      accountCreated: account.created,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not send login code. Please try again.",
      },
      { status: 500 }
    );
  }
}
