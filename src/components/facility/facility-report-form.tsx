"use client";

import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FACILITY_DEPARTMENTS,
  FACILITY_PRIORITIES,
  FACILITY_PRIORITY_LABELS,
  type FacilityPriority,
} from "@/lib/types/facility";

const MAX_PHOTOS = 5;

const fieldClass =
  "box-border h-11 w-full min-w-0 max-w-full rounded-lg bg-white px-3 text-base text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 sm:text-sm";

const labelClass = "block text-xs font-medium text-slate-600";

export function FacilityReportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<FacilityPriority>("medium");
  const [department, setDepartment] = useState("");
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);

  function onPhotosChange(files: FileList | null) {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    if (!files?.length) {
      setPreviews([]);
      return;
    }
    const selected = Array.from(files).slice(0, MAX_PHOTOS);
    setPreviews(
      selected.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }))
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("priority", priority);
    data.set("department", department);

    const fileInput = fileInputRef.current;
    if (fileInput?.files?.length) {
      data.delete("photos");
      Array.from(fileInput.files)
        .slice(0, MAX_PHOTOS)
        .forEach((file) => data.append("photos", file));
    }

    try {
      const response = await fetch("/api/facility-reports", {
        method: "POST",
        body: data,
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error ?? "Could not submit the report.");
        return;
      }

      setMessage(
        body.email?.sent === false
          ? "Report saved. Email to Facility Manager could not be sent right now — they can still see it on the dashboard."
          : "Report submitted. Facility Manager has been notified by email."
      );
      form.reset();
      setDepartment("");
      setPriority("medium");
      onPhotosChange(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="box-border w-full max-w-full space-y-4 rounded-2xl bg-white p-4 shadow-md shadow-slate-900/5 sm:space-y-5 sm:p-6 md:p-8"
    >
      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[520px]:gap-4">
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Your name</span>
          <input
            name="reporter_name"
            required
            placeholder="Full name"
            autoComplete="name"
            className={fieldClass}
          />
        </label>
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Work email</span>
          <input
            name="reporter_email"
            type="email"
            required
            placeholder="name@yourcompany.com"
            autoComplete="email"
            inputMode="email"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[520px]:gap-4">
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Department</span>
          <select
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Select department
            </option>
            {FACILITY_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Location / office</span>
          <input
            name="location"
            required
            placeholder="e.g. 2nd floor meeting room"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block min-w-0 space-y-1.5">
        <span className={labelClass}>What is broken?</span>
        <input
          name="issue_title"
          required
          placeholder="e.g. TV spoilt in Ops office"
          className={fieldClass}
        />
      </label>

      <label className="block min-w-0 space-y-1.5">
        <span className={labelClass}>How did it spoil / what happened?</span>
        <textarea
          name="how_it_spoilt"
          required
          rows={4}
          placeholder="Describe the issue, what you noticed, and any impact."
          className="box-border w-full min-w-0 max-w-full resize-y rounded-lg bg-white px-3 py-2.5 text-base leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 sm:text-sm"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[520px]:gap-4">
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>When did it happen?</span>
          <input
            name="occurred_at"
            type="datetime-local"
            required
            className={`${fieldClass} [color-scheme:light]`}
          />
        </label>

        <fieldset className="min-w-0 space-y-1.5 border-0 p-0">
          <legend className={labelClass}>Priority</legend>
          <div className="grid grid-cols-2 gap-2">
            {FACILITY_PRIORITIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`min-h-11 touch-manipulation rounded-lg px-2 py-2.5 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${
                  priority === value
                    ? value === "critical"
                      ? "bg-rose-600 text-white"
                      : value === "high"
                        ? "bg-orange-500 text-white"
                        : value === "medium"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {FACILITY_PRIORITY_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>
            Photos (optional, up to {MAX_PHOTOS})
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="touch-manipulation text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Add photos
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => onPhotosChange(e.target.files)}
        />
        {previews.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 active:bg-indigo-50 sm:px-4 sm:py-8"
          >
            <span className="text-sm font-medium text-slate-700">
              Tap to attach photos
            </span>
            <span className="text-xs text-slate-500">
              JPEG, PNG, WebP · max 5 MB each
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {previews.map((preview) => (
              <div
                key={preview.url}
                className="aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p
          className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-800 sm:px-4"
          role="alert"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          className="rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-800 sm:px-4"
          role="status"
        >
          {message}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-slate-100 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          className="h-12 touch-manipulation text-base"
        >
          {loading ? "Submitting…" : "Submit facility report"}
        </Button>
      </div>
    </form>
  );
}
