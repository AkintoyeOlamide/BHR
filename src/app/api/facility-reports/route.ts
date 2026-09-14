import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFacilityManagerOfReport } from "@/lib/email/notify-facility-report";
import {
  FACILITY_DEPARTMENTS,
  FACILITY_PRIORITIES,
  type FacilityPriority,
} from "@/lib/types/facility";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isPriority(value: string): value is FacilityPriority {
  return (FACILITY_PRIORITIES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const reporterName = String(form.get("reporter_name") ?? "").trim();
    const reporterEmail = String(form.get("reporter_email") ?? "")
      .trim()
      .toLowerCase();
    const department = String(form.get("department") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    const issueTitle = String(form.get("issue_title") ?? "").trim();
    const howItSpoilt = String(form.get("how_it_spoilt") ?? "").trim();
    const occurredAtRaw = String(form.get("occurred_at") ?? "").trim();
    const priorityRaw = String(form.get("priority") ?? "medium").trim();

    if (
      !reporterName ||
      !reporterEmail ||
      !department ||
      !location ||
      !issueTitle ||
      !howItSpoilt ||
      !occurredAtRaw
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      return NextResponse.json(
        { error: "Enter a valid work email." },
        { status: 400 }
      );
    }

    if (
      !(FACILITY_DEPARTMENTS as readonly string[]).includes(department)
    ) {
      return NextResponse.json(
        { error: "Select a valid department." },
        { status: 400 }
      );
    }

    if (!isPriority(priorityRaw)) {
      return NextResponse.json(
        { error: "Select a valid priority." },
        { status: 400 }
      );
    }

    const occurredAt = new Date(occurredAtRaw);
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json(
        { error: "Enter a valid date and time for when it happened." },
        { status: 400 }
      );
    }

    const files = form
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_PHOTOS} photos.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Photos must be JPEG, PNG, WebP, or GIF." },
          { status: 400 }
        );
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "Each photo must be under 5 MB." },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();
    const photoUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await admin.storage
        .from("facility-reports")
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Could not upload photo: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: publicUrl } = admin.storage
        .from("facility-reports")
        .getPublicUrl(path);

      photoUrls.push(publicUrl.publicUrl);
    }

    const { data: report, error: insertError } = await admin
      .from("facility_reports")
      .insert({
        reporter_name: reporterName,
        reporter_email: reporterEmail,
        department,
        location,
        issue_title: issueTitle,
        how_it_spoilt: howItSpoilt,
        occurred_at: occurredAt.toISOString(),
        priority: priorityRaw,
        status: "reported",
        photo_urls: photoUrls,
      })
      .select("*")
      .single();

    if (insertError || !report) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not save the report." },
        { status: 500 }
      );
    }

    const emailResult = await notifyFacilityManagerOfReport({
      reportId: report.id,
      reporterName,
      reporterEmail,
      department,
      location,
      issueTitle,
      howItSpoilt,
      occurredAt: report.occurred_at,
      priority: priorityRaw,
      photoCount: photoUrls.length,
    });

    return NextResponse.json({
      report,
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
      error instanceof Error ? error.message : "Could not submit report.";
    if (message === "SUPABASE_ADMIN_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Server storage is not configured." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
