"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { LAPTOP_DEPARTMENTS, LAPTOP_SPEC_PRESETS } from "@/lib/types/laptop";

const fieldClass =
  "box-border h-12 w-full min-w-0 max-w-full rounded-lg bg-white px-3 text-base text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 sm:h-11 sm:text-sm";

const labelClass = "block text-xs font-medium text-slate-600 sm:text-sm";

const textareaClass =
  "box-border w-full min-w-0 max-w-full resize-y rounded-lg bg-white px-3 py-2.5 text-base leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 sm:text-sm";

export function LaptopRequestForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState("");
  const [departmentOther, setDepartmentOther] = useState("");
  const [hasLaptop, setHasLaptop] = useState<"yes" | "no" | "">("");
  const [preferredSpec, setPreferredSpec] = useState("");

  const alreadyHasLaptop = hasLaptop === "yes";
  const reasonLabel = alreadyHasLaptop
    ? "Why do you need it changed?"
    : "Why do you need a laptop?";
  const reasonPlaceholder = alreadyHasLaptop
    ? "What's wrong with the current laptop, or why you need a replacement."
    : "What you will use it for, and why you need it now.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const fullName = String(data.get("full_name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const reason = String(data.get("reason") ?? "").trim();
    const resolvedDepartment =
      department === "Other" ? departmentOther.trim() : department;

    if (!resolvedDepartment || !hasLaptop) {
      setError(
        department === "Other" && !departmentOther.trim()
          ? "Type your department, or pick one from the list."
          : "Please fill in all required fields."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/laptop-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          department: resolvedDepartment,
          reason,
          preferred_spec: preferredSpec.trim(),
          currently_has_laptop: hasLaptop === "yes",
        }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error ?? "Could not submit the request.");
        return;
      }

      setMessage("Submitted");
      form.reset();
      setDepartment("");
      setDepartmentOther("");
      setHasLaptop("");
      setPreferredSpec("");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="box-border w-full max-w-full space-y-4 overflow-hidden rounded-xl bg-white p-4 shadow-md shadow-slate-900/5 sm:space-y-5 sm:rounded-2xl sm:p-6 md:p-8"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Your name</span>
          <input
            name="full_name"
            required
            placeholder="Full name"
            autoComplete="name"
            autoCapitalize="words"
            className={fieldClass}
          />
        </label>
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Work email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="name@yourcompany.com"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <label className="block min-w-0 space-y-1.5">
          <span className={labelClass}>Department</span>
          <select
            required
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              if (e.target.value !== "Other") setDepartmentOther("");
            }}
            className={`${fieldClass} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364758b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
            }}
          >
            <option value="" disabled>
              Select department
            </option>
            {LAPTOP_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>

        {department === "Other" ? (
          <label className="block min-w-0 space-y-1.5">
            <span className={labelClass}>Type your department</span>
            <input
              value={departmentOther}
              onChange={(e) => setDepartmentOther(e.target.value)}
              required
              placeholder="Department name"
              className={fieldClass}
            />
          </label>
        ) : null}
      </div>

      <fieldset className="min-w-0 space-y-1.5 border-0 p-0">
        <legend className={labelClass}>Do you currently have a laptop?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setHasLaptop(option.value)}
              className={`min-h-12 touch-manipulation rounded-lg px-2 py-2.5 text-sm font-semibold transition active:scale-[0.98] sm:min-h-11 ${
                hasLaptop === option.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block min-w-0 space-y-1.5">
        <span className={labelClass}>{reasonLabel}</span>
        <textarea
          key={alreadyHasLaptop ? "changed" : "need"}
          name="reason"
          required
          rows={4}
          placeholder={reasonPlaceholder}
          className={textareaClass}
        />
      </label>

      <div className="min-w-0 space-y-2">
        <span className={labelClass}>Preferred laptop specification</span>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap">
          {LAPTOP_SPEC_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPreferredSpec(preset)}
              className={`min-h-11 w-full touch-manipulation rounded-xl px-3 py-2 text-left text-xs font-medium leading-snug transition sm:w-auto sm:rounded-full sm:py-1.5 ${
                preferredSpec === preset
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <textarea
          required
          value={preferredSpec}
          onChange={(e) => setPreferredSpec(e.target.value)}
          rows={3}
          placeholder='e.g. 14-inch, 16GB RAM, 512GB SSD, Intel i7 or equivalent'
          className={textareaClass}
        />
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
          className="h-12 touch-manipulation text-base sm:h-12"
        >
          {loading ? "Submitting…" : "Submit laptop request"}
        </Button>
      </div>
    </form>
  );
}
