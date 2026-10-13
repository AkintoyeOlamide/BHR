import { NextResponse } from "next/server";
import { notifyAppInboxOfLaptopRequest } from "@/lib/email/notify-laptop-request";
import { isMissingTableError } from "@/lib/setup/list-accounts";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedLaptopDepartment } from "@/lib/types/laptop";

function parseHasLaptop(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "yes" || normalized === "true") return true;
  if (normalized === "no" || normalized === "false") return false;
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const department = String(body.department ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const preferredSpec = String(body.preferred_spec ?? "").trim();
    const currentlyHasLaptop = parseHasLaptop(body.currently_has_laptop);

    if (
      !fullName ||
      !email ||
      !department ||
      !reason ||
      !preferredSpec ||
      currentlyHasLaptop === null
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid work email." },
        { status: 400 }
      );
    }

    if (!isAllowedLaptopDepartment(department)) {
      return NextResponse.json(
        { error: "Select a department, or type it if you chose Other." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: laptopRequest, error: insertError } = await admin
      .from("laptop_requests")
      .insert({
        full_name: fullName,
        email,
        department,
        reason,
        preferred_spec: preferredSpec,
        currently_has_laptop: currentlyHasLaptop,
        status: "requested",
      })
      .select("*")
      .single();

    if (insertError || !laptopRequest) {
      const message = insertError?.message ?? "Could not save the laptop request.";
      return NextResponse.json(
        {
          error: isMissingTableError(message)
            ? "Laptop requests are not set up yet. Run supabase/migrations/026_laptop_requests.sql in the Supabase SQL Editor, then try again."
            : message,
        },
        { status: 500 }
      );
    }

    const emailResult = await notifyAppInboxOfLaptopRequest({
      requestId: laptopRequest.id,
      fullName,
      email,
      department,
      reason,
      preferredSpec,
      currentlyHasLaptop,
    });

    return NextResponse.json({
      request: laptopRequest,
      email: emailResult.ok
        ? { sent: true }
        : {
            sent: false,
            skipped: "skipped" in emailResult ? emailResult.skipped : false,
            error: "error" in emailResult ? emailResult.error : undefined,
          },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit request.";
    if (message === "SUPABASE_ADMIN_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Server storage is not configured." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
