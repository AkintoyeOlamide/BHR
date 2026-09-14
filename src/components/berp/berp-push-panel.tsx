"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { LagosTime } from "@/components/berp/lagos-time";
import type {
  BerpPushDeliveryRow,
  BerpPushMessageRow,
} from "@/lib/berp/queries";

type Props = {
  messages: BerpPushMessageRow[];
  deliveries: BerpPushDeliveryRow[];
  embedded?: boolean;
};

function lagosLocalInput(minutesFromNow = 0) {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  now.setMinutes(now.getMinutes() + minutesFromNow);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function BerpPushPanel({ messages, deliveries, embedded = false }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => lagosLocalInput(15));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const adminMessages = useMemo(
    () => messages.filter((m) => m.kind === "admin"),
    [messages]
  );
  const clockReminders = useMemo(
    () =>
      [...messages.filter((m) => m.kind === "clock_reminder")].sort((a, b) =>
        String(a.recur_time ?? "").localeCompare(String(b.recur_time ?? ""))
      ),
    [messages]
  );

  function schedule(when: string) {
    setError(null);
    setOk(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/berp/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            scheduled_at: when,
          }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(json.error || "Could not schedule notification.");
          return;
        }
        setOk("Push queued.");
        setTitle("");
        setDescription("");
        setScheduledAt(lagosLocalInput(15));
        router.refresh();
      } catch {
        setError("Network error — try again.");
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    schedule(scheduledAt);
  }

  return (
    <section className={embedded ? "berp-card" : "portal-surface mt-6"}>
      <h2 className={embedded ? "text-base font-semibold text-slate-900" : "portal-section-title"}>
        Push notifications
      </h2>

      <form
        onSubmit={onSubmit}
        className="mt-5 grid gap-4 rounded-xl border border-stone-100 bg-stone-50/50 p-4 sm:grid-cols-2"
      >
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Title
          </span>
          <input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="e.g. Office closed early"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Message text
          </span>
          <textarea
            required
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="What staff will see under the title"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Send time (Lagos / WAT)
          </span>
          <input
            required
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled={pending || !title.trim() || !description.trim()}
            onClick={() => schedule(lagosLocalInput(0))}
            className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send now"}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {pending ? "Scheduling…" : "Schedule"}
          </button>
        </div>
        {error ? (
          <p className="sm:col-span-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {ok ? (
          <p className="sm:col-span-2 text-sm text-emerald-700">{ok}</p>
        ) : null}
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Clock reminder texts
          </h3>
          {clockReminders.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No clock reminders.</p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
              {clockReminders.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-stone-100 px-3 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900">{row.title}</p>
                    <span className="portal-badge portal-badge--slate">
                      {row.recur_label ?? row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-600">{row.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Scheduled &amp; sent
          </h3>
          {adminMessages.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No admin pushes yet.</p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
              {adminMessages.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-stone-100 px-3 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900">{row.title}</p>
                    <span
                      className={
                        row.status === "sent"
                          ? "portal-badge portal-badge--emerald"
                          : row.status === "cancelled"
                            ? "portal-badge portal-badge--slate"
                            : "portal-badge portal-badge--amber"
                      }
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-600">{row.body}</p>
                  <p className="mt-1.5 text-xs text-stone-400">
                    Send{" "}
                    {row.scheduled_at ? (
                      <LagosTime value={row.scheduled_at} />
                    ) : (
                      "—"
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Delivery log
          </h3>
          {deliveries.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              No delivery events yet.
            </p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
              {deliveries.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-stone-100 px-3 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-stone-900">{row.full_name}</p>
                    <span className="portal-badge portal-badge--slate">
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-700">{row.title}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{row.body}</p>
                  <p className="mt-1.5 text-xs text-stone-400">
                    <LagosTime value={row.at} />
                    {row.device_id
                      ? ` · ${row.device_id.replace(/-/g, "").slice(0, 8).toUpperCase()}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
