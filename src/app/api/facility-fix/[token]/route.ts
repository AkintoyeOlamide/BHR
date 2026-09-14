import { after, NextResponse } from "next/server";
import { notifyFacilityManagerOfFixSubmitted } from "@/lib/email/notify-facility-report";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FacilityReport } from "@/lib/types/facility";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("facility_reports")
    .select(
      "id, issue_title, location, department, status, assigned_to_name, fix_submitted_at, fix_note, fix_photo_urls"
    )
    .eq("fix_token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Invalid link." }, { status: 400 });
    }

    const form = await request.formData();
    const fixNote = String(form.get("fix_note") ?? "").trim();

    if (!fixNote) {
      return NextResponse.json(
        { error: "Please add a short note about the fix." },
        { status: 400 }
      );
    }

    const files = form
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Upload at least one photo of the fixed issue." },
        { status: 400 }
      );
    }

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
    const { data: existing, error: findError } = await admin
      .from("facility_reports")
      .select("*")
      .eq("fix_token", token)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    const report = existing as FacilityReport;

    if (report.status === "resolved") {
      return NextResponse.json(
        { error: "This issue is already confirmed as fixed." },
        { status: 400 }
      );
    }

    if (report.fix_submitted_at) {
      return NextResponse.json(
        {
          error:
            "A fix was already submitted for this issue. Facility Manager will review it.",
        },
        { status: 400 }
      );
    }

    const photoUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `fixes/${report.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
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

    const { data: updated, error: updateError } = await admin
      .from("facility_reports")
      .update({
        fix_note: fixNote,
        fix_photo_urls: photoUrls,
        fix_submitted_at: new Date().toISOString(),
        status: "awaiting_confirm",
      })
      .eq("id", report.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Could not save the fix." },
        { status: 500 }
      );
    }

    const saved = updated as FacilityReport;

    after(async () => {
      try {
        await notifyFacilityManagerOfFixSubmitted({
          reportId: saved.id,
          issueTitle: saved.issue_title,
          assigneeName: saved.assigned_to_name || "Team member",
          fixNote,
        });
      } catch (err) {
        console.error("Facility fix-submitted email failed:", err);
      }
    });

    return NextResponse.json({
      ok: true,
      report: {
        id: saved.id,
        issue_title: saved.issue_title,
        status: saved.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit fix.";
    if (message === "SUPABASE_ADMIN_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Server storage is not configured." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
