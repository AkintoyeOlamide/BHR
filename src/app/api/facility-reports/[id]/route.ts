import { randomBytes } from "crypto";
import { after, NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessFacility } from "@/lib/auth/roles";
import {
  notifyAssigneeOfFacilityReport,
  notifyReporterOfFacilityResolved,
} from "@/lib/email/notify-facility-report";
import { createClient } from "@/lib/supabase/server";
import {
  FACILITY_STATUSES,
  type FacilityReport,
  type FacilityStatus,
} from "@/lib/types/facility";

function isStatus(value: string): value is FacilityStatus {
  return (FACILITY_STATUSES as readonly string[]).includes(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function newFixToken() {
  return randomBytes(24).toString("hex");
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireProfile();
  if (!session || !canAccessFacility(session.profile.role, session.profile.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const updates: Record<string, string | null | string[]> = {};
  let assignment:
    | {
        name: string;
        email: string;
        note: string;
        fixToken: string;
      }
    | null = null;
  let confirmDone = false;

  if (body.confirmDone === true) {
    confirmDone = true;
    updates.status = "resolved";
    updates.confirmed_at = new Date().toISOString();
    updates.confirmed_by =
      session.profile.full_name?.trim() || session.profile.email;
  }

  if (body.status != null && !confirmDone) {
    const status = String(body.status);
    if (!isStatus(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    updates.status = status;
  }

  if (body.facility_notes !== undefined) {
    updates.facility_notes =
      body.facility_notes == null || body.facility_notes === ""
        ? null
        : String(body.facility_notes).trim();
  }

  if (body.assign != null) {
    const name = String(body.assign.name ?? "").trim();
    const email = String(body.assign.email ?? "").trim().toLowerCase();
    const note = String(body.assign.note ?? "").trim();

    if (!name || !email || !note) {
      return NextResponse.json(
        { error: "Assignee name, email, and note are required." },
        { status: 400 }
      );
    }
    if (!isEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid team member email." },
        { status: 400 }
      );
    }

    const fixToken = newFixToken();
    assignment = { name, email, note, fixToken };
    updates.assigned_to_name = name;
    updates.assigned_to_email = email;
    updates.assignment_note = note;
    updates.assigned_at = new Date().toISOString();
    updates.assigned_by =
      session.profile.full_name?.trim() || session.profile.email;
    updates.fix_token = fixToken;
    updates.fix_note = null;
    updates.fix_photo_urls = [];
    updates.fix_submitted_at = null;
    updates.confirmed_at = null;
    updates.confirmed_by = null;
    if (updates.status == null) {
      updates.status = "in_progress";
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (confirmDone) {
    const { data: existing, error: existingError } = await supabase
      .from("facility_reports")
      .select("id, status, fix_submitted_at")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: existingError?.message ?? "Report not found." },
        { status: 404 }
      );
    }

    if (
      existing.status !== "awaiting_confirm" &&
      !existing.fix_submitted_at
    ) {
      return NextResponse.json(
        {
          error:
            "Confirm is only available after the assignee submits a fix.",
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("facility_reports")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const report = data as FacilityReport;

  if (assignment) {
    const assignedBy =
      session.profile.full_name?.trim() || session.profile.email;
    after(async () => {
      try {
        await notifyAssigneeOfFacilityReport({
          reportId: report.id,
          issueTitle: report.issue_title,
          location: report.location,
          department: report.department,
          priority: report.priority,
          reporterName: report.reporter_name,
          howItSpoilt: report.how_it_spoilt,
          assigneeName: assignment.name,
          assigneeEmail: assignment.email,
          assignmentNote: assignment.note,
          assignedBy,
          fixToken: assignment.fixToken,
          photoUrls: report.photo_urls ?? [],
        });
      } catch (err) {
        console.error("Facility assignment email failed:", err);
      }
    });
  }

  if (confirmDone) {
    after(async () => {
      try {
        await notifyReporterOfFacilityResolved({
          reporterName: report.reporter_name,
          reporterEmail: report.reporter_email,
          issueTitle: report.issue_title,
          location: report.location,
        });
      } catch (err) {
        console.error("Facility resolved email failed:", err);
      }
    });
  }

  return NextResponse.json({
    report,
    email: assignment || confirmDone ? { queued: true } : null,
  });
}
