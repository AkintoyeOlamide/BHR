"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCycleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setLoading(true);
    setMessage(null);

    const form = new FormData(formEl);

    const response = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        start_date: form.get("start_date"),
        end_date: form.get("end_date"),
        status: form.get("status"),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Could not create cycle.");
      return;
    }

    formEl.reset();
    setMessage("Review cycle created.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="portal-light space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900"
    >
      <h3 className="font-semibold text-slate-900">Start a new review cycle</h3>
      <Input label="Cycle name" name="title" placeholder="Q2 2026 Review" required />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          placeholder="What this review period covers"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start date" name="start_date" type="date" required />
        <Input label="End date" name="end_date" type="date" required />
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <select
          name="status"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900"
          defaultValue="active"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      {message && (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Create cycle"}
      </Button>
    </form>
  );
}
