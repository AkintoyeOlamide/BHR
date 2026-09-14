"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  token: string;
  issueTitle: string;
  location: string;
  department: string;
  assigneeName: string | null;
  alreadySubmitted: boolean;
  alreadyResolved: boolean;
};

export function FacilityFixForm({
  token,
  issueTitle,
  location,
  department,
  assigneeName,
  alreadySubmitted,
  alreadyResolved,
}: Props) {
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadySubmitted || alreadyResolved);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData();
    form.set("fix_note", note.trim());
    if (photos) {
      Array.from(photos).forEach((file) => form.append("photos", file));
    }

    const response = await fetch(`/api/facility-fix/${token}`, {
      method: "POST",
      body: form,
    });

    setSubmitting(false);
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error ?? "Could not submit the fix.");
      return;
    }

    setDone(true);
  }

  if (alreadyResolved) {
    return (
      <div className="rounded-2xl bg-emerald-50 px-5 py-6 text-sm text-emerald-900 ring-1 ring-emerald-100">
        This issue has already been confirmed as fixed. Thank you.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 px-5 py-6 text-sm text-emerald-900 ring-1 ring-emerald-100">
        <p className="font-semibold">Fix submitted</p>
        <p className="mt-1">
          Facility Manager has been notified and will confirm once reviewed.
          No further action needed from you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
          BITACHON FACILITY
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Mark issue as fixed
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {assigneeName ? `Hi ${assigneeName} — ` : ""}
          upload a photo of the fix and a short note. No login required.
        </p>
        <dl className="mt-4 space-y-1 text-sm">
          <div>
            <dt className="inline text-slate-500">Issue: </dt>
            <dd className="inline font-medium text-slate-900">{issueTitle}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Location: </dt>
            <dd className="inline font-medium text-slate-900">{location}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Department: </dt>
            <dd className="inline font-medium text-slate-900">{department}</dd>
          </div>
        </dl>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">
          What did you fix? <span className="text-rose-600">*</span>
        </span>
        <textarea
          required
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Describe the work you completed…"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">
          Photo of the fix <span className="text-rose-600">*</span>
        </span>
        <input
          required
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => setPhotos(e.target.files)}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
        />
        <p className="text-xs text-slate-500">
          Up to 5 photos, 5 MB each (JPEG, PNG, WebP, GIF).
        </p>
      </label>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Submitting…" : "Submit fix to Facility Manager"}
      </Button>
    </form>
  );
}
