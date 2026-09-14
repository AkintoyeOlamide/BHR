import { NextResponse } from "next/server";
import { isPasswordLoginEmail } from "@/lib/auth/roles";
import { ensureStaffAccountForLogin } from "@/lib/auth/ensure-staff-account";
import { consumeLoginOtp, OTP_LENGTH } from "@/lib/auth/otp";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const code = String(body.code ?? "")
      .trim()
      .replace(/\s+/g, "");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid work email." },
        { status: 400 }
      );
    }

    if (isPasswordLoginEmail(email)) {
      return NextResponse.json(
        { error: "This account signs in with a password." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(code) || code.length !== OTP_LENGTH) {
      return NextResponse.json(
        { error: "Enter the 4-digit code from your email." },
        { status: 400 }
      );
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
        { error: "No staff record found for that email." },
        { status: 404 }
      );
    }

    let otpResult;
    try {
      otpResult = await consumeLoginOtp(email, code);
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

    if (!otpResult.ok) {
      return NextResponse.json({ error: otpResult.error }, { status: 401 });
    }

    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(account.id, { email_confirm: true });

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData?.properties) {
      return NextResponse.json(
        {
          error:
            linkError?.message ??
            "Could not start your session. Please try again.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const tokenHash = linkData.properties.hashed_token;
    const emailOtp = linkData.properties.email_otp;

    let verifyError =
      (
        await supabase.auth.verifyOtp({
          type: "email",
          token_hash: tokenHash,
        })
      ).error ?? null;

    if (verifyError && emailOtp) {
      verifyError =
        (
          await supabase.auth.verifyOtp({
            email,
            token: emailOtp,
            type: "email",
          })
        ).error ?? null;
    }

    if (verifyError) {
      return NextResponse.json(
        {
          error:
            verifyError.message ||
            "Could not verify your session. Please request a new code.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not verify code. Please try again.",
      },
      { status: 500 }
    );
  }
}
