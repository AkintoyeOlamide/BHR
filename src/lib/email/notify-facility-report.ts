import {
  facilityEmailSubject,
  getAppUrl,
  getFacilityEmailFrom,
} from "@/lib/email/env";
import { sendEmail, type EmailAttachment } from "@/lib/email/send";
import { getFacilityManagerEmail } from "@/lib/facility/env";
import {
  FACILITY_PRIORITY_LABELS,
  type FacilityPriority,
} from "@/lib/types/facility";

export type FacilityReportEmailInput = {
  reportId: string;
  reporterName: string;
  reporterEmail: string;
  department: string;
  location: string;
  issueTitle: string;
  howItSpoilt: string;
  occurredAt: string;
  priority: FacilityPriority;
  photoCount: number;
};

export type FacilityAssignmentEmailInput = {
  reportId: string;
  issueTitle: string;
  location: string;
  department: string;
  priority: FacilityPriority;
  reporterName: string;
  howItSpoilt: string;
  assigneeName: string;
  assigneeEmail: string;
  assignmentNote: string;
  assignedBy: string;
  fixToken: string;
  photoUrls: string[];
};

export type FacilityFixSubmittedEmailInput = {
  reportId: string;
  issueTitle: string;
  assigneeName: string;
  fixNote: string;
};

export type FacilityReporterResolvedEmailInput = {
  reporterName: string;
  reporterEmail: string;
  issueTitle: string;
  location: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchPhotoAttachments(
  urls: string[]
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];

  for (const [index, url] of urls.slice(0, 5).entries()) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const contentType =
        response.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : contentType.includes("gif")
            ? "gif"
            : "jpg";
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) continue;
      attachments.push({
        filename: `issue-photo-${index + 1}.${ext}`,
        content: buffer,
        contentType,
      });
    } catch {
      // Skip failed photo downloads; email still sends.
    }
  }

  return attachments;
}

export function buildFacilityReportEmail(input: FacilityReportEmailInput) {
  const dashboardUrl = `${getAppUrl()}/facility?report=${input.reportId}`;
  const priorityLabel = FACILITY_PRIORITY_LABELS[input.priority];

  const subject = facilityEmailSubject(
    `Issue reported by ${input.reporterName}: ${input.issueTitle}`
  );

  const text = [
    `An issue has been reported by ${input.reporterName}.`,
    "",
    `Issue: ${input.issueTitle}`,
    `Location: ${input.location}`,
    `Department: ${input.department}`,
    `Priority: ${priorityLabel}`,
    `Reporter email: ${input.reporterEmail}`,
    "",
    "View this issue on your Facility dashboard:",
    dashboardUrl,
    "",
    "BITACHON FACILITY",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5">
        BITACHON FACILITY
      </p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">
        An issue has been reported
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#334155">
        Reported by <strong>${escapeHtml(input.reporterName)}</strong>
        (${escapeHtml(input.reporterEmail)}).
      </p>
      <div style="margin:0 0 24px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Issue:</strong> ${escapeHtml(input.issueTitle)}</p>
        <p style="margin:0 0 8px"><strong>Location:</strong> ${escapeHtml(input.location)}</p>
        <p style="margin:0 0 8px"><strong>Department:</strong> ${escapeHtml(input.department)}</p>
        <p style="margin:0"><strong>Priority:</strong> ${escapeHtml(priorityLabel)}</p>
      </div>
      <p style="margin:0 0 24px">
        <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          View issue on dashboard
        </a>
      </p>
    </div>
  `;

  return { subject, html, text };
}

export function buildFacilityAssignmentEmail(
  input: FacilityAssignmentEmailInput
) {
  const priorityLabel = FACILITY_PRIORITY_LABELS[input.priority];
  const fixUrl = `${getAppUrl()}/facility-fix/${input.fixToken}`;
  const subject = facilityEmailSubject(
    `Assigned to you: ${input.issueTitle}`
  );

  const text = [
    `Hi ${input.assigneeName},`,
    "",
    `A facility issue has been assigned to you by ${input.assignedBy}.`,
    "",
    `Issue: ${input.issueTitle}`,
    `Location: ${input.location}`,
    `Department: ${input.department}`,
    `Priority: ${priorityLabel}`,
    `Reported by: ${input.reporterName}`,
    "",
    "Assignment note:",
    input.assignmentNote,
    "",
    "What was reported:",
    input.howItSpoilt,
    "",
    "Issue photos are attached to this email (if available).",
    "",
    "When the issue is fixed, open this link (no login needed):",
    fixUrl,
    "Upload a photo of the fix and leave a short note.",
    "",
    "BITACHON FACILITY",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5">
        BITACHON FACILITY
      </p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">
        A facility issue was assigned to you
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#334155">
        Hi <strong>${escapeHtml(input.assigneeName)}</strong>,
        ${escapeHtml(input.assignedBy)} assigned this job to you.
      </p>
      <div style="margin:0 0 20px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Issue:</strong> ${escapeHtml(input.issueTitle)}</p>
        <p style="margin:0 0 8px"><strong>Location:</strong> ${escapeHtml(input.location)}</p>
        <p style="margin:0 0 8px"><strong>Department:</strong> ${escapeHtml(input.department)}</p>
        <p style="margin:0 0 8px"><strong>Priority:</strong> ${escapeHtml(priorityLabel)}</p>
        <p style="margin:0"><strong>Reported by:</strong> ${escapeHtml(input.reporterName)}</p>
      </div>
      <div style="margin:0 0 20px;padding:16px;border-left:4px solid #4f46e5;background:#eef2ff">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#4338ca">
          Assignment note
        </p>
        <p style="margin:0;white-space:pre-wrap;color:#1e1b4b">${escapeHtml(input.assignmentNote)}</p>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b">What was reported</p>
      <p style="margin:0 0 20px;white-space:pre-wrap;font-size:14px;color:#334155">${escapeHtml(input.howItSpoilt)}</p>
      <p style="margin:0 0 12px;font-size:14px;color:#334155">
        Issue photos are attached to this email when available.
      </p>
      <p style="margin:0 0 24px">
        <a href="${fixUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Mark as fixed (upload photo + note)
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b">
        No login needed. Link:
        <a href="${fixUrl}" style="color:#4f46e5">${fixUrl}</a>
      </p>
    </div>
  `;

  return { subject, html, text };
}

export async function notifyFacilityManagerOfReport(
  input: FacilityReportEmailInput
) {
  const { subject, html, text } = buildFacilityReportEmail(input);

  return sendEmail({
    to: getFacilityManagerEmail(),
    from: getFacilityEmailFrom(),
    subject,
    html,
    text,
  });
}

export async function notifyAssigneeOfFacilityReport(
  input: FacilityAssignmentEmailInput
) {
  const { subject, html, text } = buildFacilityAssignmentEmail(input);
  const attachments = await fetchPhotoAttachments(input.photoUrls);

  return sendEmail({
    to: input.assigneeEmail,
    from: getFacilityEmailFrom(),
    subject,
    html,
    text,
    attachments,
  });
}

export async function notifyFacilityManagerOfFixSubmitted(
  input: FacilityFixSubmittedEmailInput
) {
  const dashboardUrl = `${getAppUrl()}/facility?report=${input.reportId}`;
  const subject = facilityEmailSubject(
    `Fix submitted for review: ${input.issueTitle}`
  );

  const text = [
    `${input.assigneeName} marked an issue as fixed and uploaded evidence.`,
    "",
    `Issue: ${input.issueTitle}`,
    "",
    "Staff note:",
    input.fixNote,
    "",
    "Review and confirm on the Facility dashboard:",
    dashboardUrl,
    "",
    "BITACHON FACILITY",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5">
        BITACHON FACILITY
      </p>
      <h1 style="margin:0 0 12px;font-size:20px">Fix submitted for your review</h1>
      <p style="margin:0 0 16px;color:#334155">
        <strong>${escapeHtml(input.assigneeName)}</strong> uploaded proof and a note for
        <strong>${escapeHtml(input.issueTitle)}</strong>.
      </p>
      <div style="margin:0 0 20px;padding:16px;border-left:4px solid #059669;background:#ecfdf5">
        <p style="margin:0;white-space:pre-wrap;color:#064e3b">${escapeHtml(input.fixNote)}</p>
      </div>
      <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
        Review &amp; confirm done
      </a>
    </div>
  `;

  return sendEmail({
    to: getFacilityManagerEmail(),
    from: getFacilityEmailFrom(),
    subject,
    html,
    text,
  });
}

export async function notifyReporterOfFacilityResolved(
  input: FacilityReporterResolvedEmailInput
) {
  const subject = facilityEmailSubject(
    `Your issue has been fixed: ${input.issueTitle}`
  );

  const text = [
    `Hi ${input.reporterName},`,
    "",
    `Your facility report has been fixed and confirmed.`,
    "",
    `Issue: ${input.issueTitle}`,
    `Location: ${input.location}`,
    "",
    "Thank you for reporting it.",
    "",
    "BITACHON FACILITY",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5">
        BITACHON FACILITY
      </p>
      <h1 style="margin:0 0 12px;font-size:20px">Your issue has been fixed</h1>
      <p style="margin:0 0 16px;color:#334155">
        Hi <strong>${escapeHtml(input.reporterName)}</strong>, the Facility team confirmed
        that your report is resolved.
      </p>
      <div style="margin:0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Issue:</strong> ${escapeHtml(input.issueTitle)}</p>
        <p style="margin:0"><strong>Location:</strong> ${escapeHtml(input.location)}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: input.reporterEmail,
    from: getFacilityEmailFrom(),
    subject,
    html,
    text,
  });
}
