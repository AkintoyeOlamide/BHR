"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AutoRefresh } from "@/components/berp/auto-refresh";
import { BerpAvatar } from "@/components/berp/berp-avatar";
import { BerpPushPanel } from "@/components/berp/berp-push-panel";
import {
  IconLate,
  IconLeave,
  IconLive,
  IconMegaphone,
  IconUpdates,
} from "@/components/berp/berp-icons";
import { LagosTime } from "@/components/berp/lagos-time";
import { LiveElapsed } from "@/components/berp/live-elapsed";
import { PunctualityBadge } from "@/components/berp/punctuality-badge";
import {
  BerpShell,
  berpHref,
  parseBerpView,
  type BerpNotice,
  type BerpView,
  type BerpViewer,
} from "@/components/berp/berp-shell";
import type {
  BerpClockRow,
  BerpLeaveRow,
  BerpPushDeliveryRow,
  BerpPushMessageRow,
  BerpStaffRow,
  BerpUpdateRow,
} from "@/lib/berp/queries";
import {
  displayLagos,
  displayLagosClockTime,
  formatDuration,
  formatYmdLong,
  isLagosToday,
  isLateClockIn,
  leaveCoversLagosToday,
} from "@/lib/berp/time";

type BerpDashboardProps = {
  live: BerpClockRow[];
  staff: BerpStaffRow[];
  clock: BerpClockRow[];
  leave: BerpLeaveRow[];
  updates: BerpUpdateRow[];
  pushMessages: BerpPushMessageRow[];
  pushDeliveries: BerpPushDeliveryRow[];
  errors: string;
  viewer: BerpViewer;
  initialView?: string | null;
};

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function matchesQuery(query: string, ...values: Array<string | null | undefined>) {
  if (!query) return true;
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

function statusClass(status: string) {
  const key = status.toLowerCase();
  if (key === "pending") return "berp-pill berp-pill--amber";
  if (key === "approved" || key === "active" || key === "live") {
    return "berp-pill berp-pill--emerald";
  }
  return "berp-pill berp-pill--slate";
}

function shortDeviceId(deviceId: string | null | undefined) {
  const compact = (deviceId ?? "").replace(/-/g, "").toUpperCase();
  return compact.length >= 8 ? compact.slice(0, 8) : compact || null;
}

function deviceName(row: Pick<BerpClockRow, "device_label" | "device_model">) {
  return row.device_label || row.device_model || null;
}

function DeviceDetails({ row }: { row: BerpClockRow }) {
  const name = deviceName(row);
  const id = shortDeviceId(row.device_id);
  if (!name && !row.device_os && !id) {
    return <span className="text-slate-400">Unknown device</span>;
  }
  return (
    <div>
      <p className="font-medium text-slate-800">{name || "Device"}</p>
      <p className="text-xs text-slate-400">
        {[row.device_os, id ? `ID ${id}` : null].filter(Boolean).join(" · ") || "—"}
      </p>
    </div>
  );
}

function LoginAddress({ row }: { row: BerpClockRow }) {
  if (!row.public_ip && !row.site_name) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div>
      <p className="font-mono text-sm font-medium text-slate-800">
        {row.public_ip || "—"}
      </p>
      {row.site_name ? (
        <p className="text-xs text-slate-400">{row.site_name}</p>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function ViewLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="berp-view-link"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="px-1 py-8 text-sm text-slate-500">{children}</p>;
}

export function BerpDashboard({
  live,
  staff,
  clock,
  leave,
  updates,
  pushMessages,
  pushDeliveries,
  errors,
  viewer,
  initialView,
}: BerpDashboardProps) {
  const router = useRouter();
  const [view, setView] = useState<BerpView>(() => parseBerpView(initialView));
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = search.trim().toLowerCase();

  useEffect(() => {
    setView(parseBerpView(initialView));
  }, [initialView]);

  function go(next: BerpView) {
    setView(next);
    router.push(berpHref(next), { scroll: false });
  }

  const selected = useMemo(
    () => staff.find((row) => row.id === selectedId) ?? null,
    [staff, selectedId]
  );
  const selectedClock = useMemo(
    () => (selectedId ? clock.filter((row) => row.user_id === selectedId) : []),
    [clock, selectedId]
  );

  const lateRows = useMemo(
    () =>
      clock.filter(
        (row) => isLagosToday(row.clock_in) && isLateClockIn(row.clock_in)
      ),
    [clock]
  );
  const latePeople = useMemo(() => {
    const seen = new Map<string, BerpClockRow>();
    for (const row of lateRows) {
      if (!seen.has(row.user_id)) seen.set(row.user_id, row);
    }
    return [...seen.values()];
  }, [lateRows]);

  const pendingLeave = useMemo(
    () => leave.filter((row) => row.status.toLowerCase() === "pending"),
    [leave]
  );
  const activeLeave = useMemo(
    () =>
      leave.filter(
        (row) =>
          leaveCoversLagosToday(row.start_date, row.end_date) &&
          ["approved", "active"].includes(row.status.toLowerCase())
      ),
    [leave]
  );
  const updatesToday = useMemo(
    () => updates.filter((row) => isLagosToday(row.created_at)),
    [updates]
  );
  const clockedTodayIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of clock) {
      if (isLagosToday(row.clock_in)) ids.add(row.user_id);
    }
    return ids;
  }, [clock]);
  const notInYet = useMemo(
    () => staff.filter((row) => !row.live && !clockedTodayIds.has(row.id)),
    [staff, clockedTodayIds]
  );
  const filteredLatePeople = useMemo(
    () =>
      latePeople.filter((row) => matchesQuery(query, row.full_name, row.email)),
    [latePeople, query]
  );
  const filteredNotInYet = useMemo(
    () =>
      notInYet.filter((row) =>
        matchesQuery(query, row.full_name, row.email, row.department, row.job_title)
      ),
    [notInYet, query]
  );

  const filteredLive = useMemo(
    () => live.filter((row) => matchesQuery(query, row.full_name, row.email)),
    [live, query]
  );
  const filteredLeave = useMemo(
    () =>
      leave.filter((row) =>
        matchesQuery(query, row.full_name, row.kind, row.status, row.note)
      ),
    [leave, query]
  );
  const filteredUpdates = useMemo(
    () =>
      updates.filter((row) =>
        matchesQuery(query, row.title, row.body, row.author_name, row.author_role)
      ),
    [updates, query]
  );
  const filteredStaff = useMemo(
    () =>
      staff.filter((row) =>
        matchesQuery(
          query,
          row.full_name,
          row.email,
          row.department,
          row.job_title,
          row.company
        )
      ),
    [staff, query]
  );
  const filteredClock = useMemo(
    () =>
      clock.filter((row) =>
        matchesQuery(
          query,
          row.full_name,
          row.email,
          row.site_name,
          row.device_label,
          row.device_model,
          row.device_os,
          row.public_ip
        )
      ),
    [clock, query]
  );

  const leaveQueue = useMemo(() => {
    const rows = query ? filteredLeave : leave;
    return [...rows].sort((a, b) => {
      const pendingA = a.status.toLowerCase() === "pending" ? 0 : 1;
      const pendingB = b.status.toLowerCase() === "pending" ? 0 : 1;
      if (pendingA !== pendingB) return pendingA - pendingB;
      return b.start_date.localeCompare(a.start_date);
    });
  }, [filteredLeave, leave, query]);

  const notices = useMemo<BerpNotice[]>(() => {
    const items: BerpNotice[] = [];
    for (const row of pendingLeave.slice(0, 4)) {
      items.push({
        id: `leave-${row.id}`,
        title: `${row.full_name} requested leave`,
        detail: `${titleCase(row.kind)} · ${formatYmdLong(row.start_date)}`,
        view: "leave",
      });
    }
    for (const row of updatesToday.slice(0, 4)) {
      items.push({
        id: `update-${row.id}`,
        title: row.title,
        detail: row.author_name || "Staff update",
        view: "updates",
      });
    }
    if (latePeople.length > 0) {
      items.push({
        id: "late-today",
        title: `${latePeople.length} late today`,
        detail: "Open reports for names and times",
        view: "late",
      });
    }
    return items.slice(0, 8);
  }, [latePeople.length, pendingLeave, updatesToday]);

  return (
    <>
      <AutoRefresh seconds={5} />
      <BerpShell
        viewer={viewer}
        view={view}
        onViewChange={go}
        search={search}
        onSearchChange={setSearch}
        notices={notices}
      >
        {errors ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {errors}
          </div>
        ) : null}

        {view === "dashboard" ? (
          <DashboardHome
            liveCount={live.length}
            lateCount={latePeople.length}
            onLeaveCount={activeLeave.length}
            updatesTodayCount={updatesToday.length}
            live={filteredLive}
            leave={leaveQueue}
            updates={query ? filteredUpdates : updates}
            onOpenStaff={setSelectedId}
            onViewChange={go}
          />
        ) : null}

        {view === "attendance" || view === "live" || view === "late" ? (
          <AttendanceView
            rows={
              view === "live"
                ? filteredLive
                : view === "late"
                  ? filteredLatePeople
                  : filteredClock
            }
            filter={view === "live" ? "live" : view === "late" ? "late" : "all"}
            onFilterChange={(next) =>
              go(next === "all" ? "attendance" : next)
            }
            onOpenStaff={setSelectedId}
          />
        ) : null}

        {view === "leave" ? (
          <LeaveView rows={leaveQueue} onOpenStaff={setSelectedId} />
        ) : null}

        {view === "updates" ? (
          <UpdatesView rows={query ? filteredUpdates : updates} />
        ) : null}

        {view === "staff" ? (
          <StaffView rows={filteredStaff} onOpenStaff={setSelectedId} />
        ) : null}

        {view === "reports" ? (
          <ReportsView
            liveCount={live.length}
            staffCount={staff.length}
            latePeople={filteredLatePeople}
            notInYet={filteredNotInYet}
            clockedToday={clockedTodayIds.size}
            pendingLeave={pendingLeave.length}
            onOpenStaff={setSelectedId}
          />
        ) : null}

        {view === "settings" ? (
          <BerpPushPanel
            messages={pushMessages}
            deliveries={pushDeliveries}
            embedded
          />
        ) : null}
      </BerpShell>

      {selected ? (
        <StaffDrawer
          selected={selected}
          selectedClock={selectedClock}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </>
  );
}

function DashboardHome({
  liveCount,
  lateCount,
  onLeaveCount,
  updatesTodayCount,
  live,
  leave,
  updates,
  onOpenStaff,
  onViewChange,
}: {
  liveCount: number;
  lateCount: number;
  onLeaveCount: number;
  updatesTodayCount: number;
  live: BerpClockRow[];
  leave: BerpLeaveRow[];
  updates: BerpUpdateRow[];
  onOpenStaff: (id: string) => void;
  onViewChange: (view: BerpView) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="berp-kpi berp-kpi--live">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => onViewChange("live")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="berp-kpi-icon berp-kpi-icon--live">
                  <IconLive />
                </span>
                <h2 className="text-sm font-semibold text-slate-800">
                  Currently Live
                </h2>
              </div>
              <span className="berp-view-link">View all →</span>
            </div>
            <p className="berp-kpi-value text-emerald-600">{liveCount}</p>
            <p className="text-sm text-slate-500">staff</p>
          </button>
        </article>

        <article className="berp-kpi berp-kpi--late">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => onViewChange("late")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="berp-kpi-icon berp-kpi-icon--late">
                  <IconLate />
                </span>
                <h2 className="text-sm font-semibold text-slate-800">Late Today</h2>
              </div>
              <span className="berp-view-link">View details →</span>
            </div>
            <p className="berp-kpi-value text-rose-500">{lateCount}</p>
            <p className="text-sm text-slate-500">staff</p>
          </button>
        </article>

        <article className="berp-kpi berp-kpi--leave">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => onViewChange("leave")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="berp-kpi-icon berp-kpi-icon--leave">
                  <IconLeave />
                </span>
                <h2 className="text-sm font-semibold text-slate-800">On Leave</h2>
              </div>
              <span className="berp-view-link">View leave queue →</span>
            </div>
            <p className="berp-kpi-value text-indigo-500">{onLeaveCount}</p>
            <p className="text-sm text-slate-500">active</p>
          </button>
        </article>

        <article className="berp-kpi berp-kpi--updates">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => onViewChange("updates")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="berp-kpi-icon berp-kpi-icon--updates">
                  <IconUpdates />
                </span>
                <h2 className="text-sm font-semibold text-slate-800">Updates</h2>
              </div>
              <span className="berp-view-link">View updates →</span>
            </div>
            <p className="berp-kpi-value text-violet-500">{updatesTodayCount}</p>
            <p className="text-sm text-slate-500">new today</p>
          </button>
        </article>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)]">
        <section className="berp-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="berp-kpi-icon berp-kpi-icon--live">
                <IconLive />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Live on the clock
                </h2>
                <p className="text-sm text-slate-500">Real-time staff attendance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="berp-pill berp-pill--emerald">{liveCount} live</span>
              <ViewLink onClick={() => onViewChange("live")}>
                View all
              </ViewLink>
            </div>
          </div>

          {live.length === 0 ? (
            <EmptyState>Nobody is clocked in right now.</EmptyState>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="berp-table berp-table--live">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Device</th>
                    <th>Login address</th>
                    <th>Time in</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {live.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <button
                          type="button"
                          className="flex items-center gap-3 text-left"
                          onClick={() => onOpenStaff(row.user_id)}
                        >
                          <BerpAvatar name={row.full_name} />
                          <span>
                            <span className="block font-semibold text-slate-900">
                              {row.full_name}
                            </span>
                            <span className="block text-xs text-slate-400">
                              {row.email || "No email"}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td>
                        <DeviceDetails row={row} />
                      </td>
                      <td>
                        <LoginAddress row={row} />
                      </td>
                      <td className="font-medium tabular-nums text-slate-700">
                        {displayLagosClockTime(row.clock_in, row.clock_in_lagos)}
                      </td>
                      <td>
                        <LiveElapsed
                          clockIn={row.clock_in}
                          className="font-semibold text-emerald-600"
                        />
                      </td>
                      <td>
                        <span className="berp-pill berp-pill--live">Live</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm text-slate-400">
            <p>
              Showing {live.length} of {liveCount} staff currently on the clock
            </p>
            <p className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              All systems online
            </p>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="berp-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="berp-kpi-icon berp-kpi-icon--leave">
                  <IconLeave />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Leave queue
                  </h2>
                  <p className="text-sm text-slate-500">Pending leave requests</p>
                </div>
              </div>
              <ViewLink onClick={() => onViewChange("leave")}>View all</ViewLink>
            </div>
            {leave.length === 0 ? (
              <EmptyState>No leave requests yet.</EmptyState>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {leave.slice(0, 4).map((row) => (
                  <li key={row.id} className="flex items-center gap-3 py-3">
                    <BerpAvatar name={row.full_name} size="sm" />
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onOpenStaff(row.user_id)}
                    >
                      <p className="truncate font-semibold text-slate-900">
                        {row.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {titleCase(row.kind)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatYmdLong(row.start_date)} → {formatYmdLong(row.end_date)}
                      </p>
                    </button>
                    <span className={statusClass(row.status)}>
                      {titleCase(row.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="berp-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="berp-kpi-icon berp-kpi-icon--updates">
                  <IconMegaphone />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Staff updates
                  </h2>
                  <p className="text-sm text-slate-500">
                    Latest announcements and updates
                  </p>
                </div>
              </div>
              <ViewLink onClick={() => onViewChange("updates")}>View all</ViewLink>
            </div>
            {updates.length === 0 ? (
              <EmptyState>No updates yet.</EmptyState>
            ) : (
              <ul className="mt-4 space-y-4">
                {updates.slice(0, 3).map((row) => (
                  <li key={row.id} className="flex gap-3">
                    <BerpAvatar name={row.author_name || "Staff"} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{row.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {row.body}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                        <span>{row.author_name}</span>
                        {row.author_role ? (
                          <>
                            <span>·</span>
                            <span>{row.author_role}</span>
                          </>
                        ) : null}
                        <span>·</span>
                        <LagosTime value={row.created_at} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function AttendanceView({
  rows,
  filter,
  onFilterChange,
  onOpenStaff,
}: {
  rows: BerpClockRow[];
  filter: "all" | "live" | "late";
  onFilterChange: (filter: "all" | "live" | "late") => void;
  onOpenStaff: (id: string) => void;
}) {
  const empty =
    filter === "live"
      ? "Nobody is clocked in right now."
      : filter === "late"
        ? "No late clock-ins today."
        : "No clock rows yet.";

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="berp-filters">
          {(
            [
              ["all", "All sessions"],
              ["live", "Live now"],
              ["late", "Late today"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`berp-filter ${filter === id ? "berp-filter--active" : ""}`}
              onClick={() => onFilterChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{rows.length} records</p>
      </div>

      <section className="berp-card overflow-hidden p-0">
        {rows.length === 0 ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="berp-table berp-table--padded">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Device</th>
                  <th>Login address</th>
                  <th>In (WAT)</th>
                  <th>Out (WAT)</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const open = !row.clock_out;
                  return (
                    <tr key={row.id}>
                      <td>
                        <button
                          type="button"
                          className="flex items-center gap-3 text-left"
                          onClick={() => onOpenStaff(row.user_id)}
                        >
                          <BerpAvatar name={row.full_name} size="sm" />
                          <span>
                            <span className="block font-semibold text-slate-900">
                              {row.full_name}
                            </span>
                            <span className="block text-xs text-slate-400">
                              {row.email || "No email"}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td>
                        <DeviceDetails row={row} />
                      </td>
                      <td>
                        <LoginAddress row={row} />
                      </td>
                      <td className="font-medium text-slate-800">
                        {displayLagos(row.clock_in, row.clock_in_lagos)}
                      </td>
                      <td className="text-slate-600">
                        {open
                          ? "—"
                          : displayLagos(row.clock_out, row.clock_out_lagos)}
                      </td>
                      <td className="text-slate-600">
                        {open ? (
                          <LiveElapsed
                            clockIn={row.clock_in}
                            className="text-emerald-600"
                          />
                        ) : (
                          formatDuration(row.clock_in, row.clock_out)
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={
                              open
                                ? "berp-pill berp-pill--live"
                                : "berp-pill berp-pill--slate"
                            }
                          >
                            {open ? "Live" : "Closed"}
                          </span>
                          <PunctualityBadge clockIn={row.clock_in} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function LeaveView({
  rows,
  onOpenStaff,
}: {
  rows: BerpLeaveRow[];
  onOpenStaff: (id: string) => void;
}) {
  if (rows.length === 0) {
    return <section className="berp-card"><EmptyState>No leave requests yet.</EmptyState></section>;
  }

  return (
    <section className="berp-card">
      <ul className="divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 py-4">
            <BerpAvatar name={row.full_name} />
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => onOpenStaff(row.user_id)}
            >
              <p className="font-semibold text-slate-900">{row.full_name}</p>
              <p className="text-sm text-slate-500">{titleCase(row.kind)}</p>
              <p className="mt-1 text-xs text-slate-400">
                {formatYmdLong(row.start_date)} → {formatYmdLong(row.end_date)}
                {row.note ? ` · ${row.note}` : ""}
              </p>
            </button>
            <span className={statusClass(row.status)}>{titleCase(row.status)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpdatesView({ rows }: { rows: BerpUpdateRow[] }) {
  if (rows.length === 0) {
    return <section className="berp-card"><EmptyState>No updates yet.</EmptyState></section>;
  }

  return (
    <section className="grid gap-4">
      {rows.map((row) => (
        <article key={row.id} className="berp-card">
          <div className="flex gap-3">
            <BerpAvatar name={row.author_name || "Staff"} />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">{row.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{row.body}</p>
              <p className="mt-3 text-xs text-slate-400">
                {row.author_name}
                {row.author_role ? ` · ${row.author_role}` : ""} ·{" "}
                <LagosTime value={row.created_at} />
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function StaffView({
  rows,
  onOpenStaff,
}: {
  rows: BerpStaffRow[];
  onOpenStaff: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <section className="berp-card">
        <EmptyState>
          No BERP activity yet. When someone clocks in on the phone app, they
          will appear here.
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="berp-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="berp-table berp-table--padded">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company / role</th>
              <th>Status</th>
              <th>Last in</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer"
                onClick={() => onOpenStaff(row.id)}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <BerpAvatar name={row.full_name} src={row.avatar_url} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-900">{row.full_name}</p>
                      <p className="text-xs text-slate-400">{row.email || "No email"}</p>
                    </div>
                  </div>
                </td>
                <td className="text-slate-500">
                  {[row.company, row.job_title, row.department]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td>
                  <span className={row.live ? "berp-pill berp-pill--live" : "berp-pill berp-pill--slate"}>
                    {row.live ? "Live" : "Off"}
                  </span>
                </td>
                <td className="text-slate-600">
                  {displayLagos(row.last_clock_in, row.last_clock_in_lagos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportsView({
  liveCount,
  staffCount,
  latePeople,
  notInYet,
  clockedToday,
  pendingLeave,
  onOpenStaff,
}: {
  liveCount: number;
  staffCount: number;
  latePeople: BerpClockRow[];
  notInYet: BerpStaffRow[];
  clockedToday: number;
  pendingLeave: number;
  onOpenStaff: (id: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="berp-card">
          <p className="text-sm text-slate-500">Live now</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{liveCount}</p>
        </article>
        <article className="berp-card">
          <p className="text-sm text-slate-500">Clocked in today</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{clockedToday}</p>
        </article>
        <article className="berp-card">
          <p className="text-sm text-slate-500">Late today</p>
          <p className="mt-2 text-3xl font-semibold text-rose-500">{latePeople.length}</p>
        </article>
        <article className="berp-card">
          <p className="text-sm text-slate-500">Pending leave</p>
          <p className="mt-2 text-3xl font-semibold text-amber-500">{pendingLeave}</p>
        </article>
      </div>

      <section className="berp-card">
        <h2 className="text-base font-semibold text-slate-900">Late today</h2>
        {latePeople.length === 0 ? (
          <EmptyState>No late clock-ins today.</EmptyState>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {latePeople.map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-3">
                <BerpAvatar name={row.full_name} size="sm" />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onOpenStaff(row.user_id)}
                >
                  <p className="font-semibold text-slate-900">{row.full_name}</p>
                  <p className="text-xs text-slate-400">{row.email}</p>
                </button>
                <span className="text-sm tabular-nums text-slate-600">
                  {displayLagosClockTime(row.clock_in, row.clock_in_lagos)}
                </span>
                <PunctualityBadge clockIn={row.clock_in} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="berp-card">
        <h2 className="text-base font-semibold text-slate-900">
          Not in yet
          <span className="ml-2 text-sm font-medium text-slate-400">
            {notInYet.length} of {staffCount}
          </span>
        </h2>
        {notInYet.length === 0 ? (
          <EmptyState>Everyone who uses BERP has clocked in today.</EmptyState>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {notInYet.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-slate-50"
                  onClick={() => onOpenStaff(row.id)}
                >
                  <BerpAvatar name={row.full_name} src={row.avatar_url} size="sm" />
                  <span>
                    <span className="block font-medium text-slate-900">
                      {row.full_name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {row.department || row.job_title || "Staff"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StaffDrawer({
  selected,
  selectedClock,
  onClose,
}: {
  selected: BerpStaffRow;
  selectedClock: BerpClockRow[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 p-0 sm:p-4">
      <button
        type="button"
        aria-label="Close profile"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <BerpAvatar name={selected.full_name} src={selected.avatar_url} size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {selected.full_name}
              </h3>
              <p className="text-sm text-slate-500">{selected.email || "No email"}</p>
              <div className="mt-2">
                <span className={selected.live ? "berp-pill berp-pill--live" : "berp-pill berp-pill--slate"}>
                  {selected.live ? "Live" : "Off"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Profile
          </h4>
          <dl className="mt-1">
            <DetailRow label="Full name" value={selected.full_name} />
            <DetailRow label="Email" value={selected.email || "—"} />
            <DetailRow label="Phone" value={selected.phone || "—"} />
            <DetailRow label="Company" value={selected.company || "—"} />
            <DetailRow label="Role" value={selected.role || "—"} />
            <DetailRow label="Job title" value={selected.job_title || "—"} />
            <DetailRow label="Department" value={selected.department || "—"} />
            <DetailRow label="Joined year" value={selected.joined_year ?? "—"} />
            <DetailRow label="Site" value={selected.site_name || "—"} />
            <DetailRow label="Sessions" value={String(selected.session_count)} />
            <DetailRow
              label="Created"
              value={
                selected.created_at ? <LagosTime value={selected.created_at} /> : "—"
              }
            />
          </dl>

          <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Clock history (BERP)
          </h4>
          {selectedClock.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No clock sessions.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedClock.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl border border-slate-100 px-3 py-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">
                      {displayLagos(row.clock_in, row.clock_in_lagos)}
                    </p>
                    <PunctualityBadge clockIn={row.clock_in} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Out{" "}
                    {row.clock_out
                      ? displayLagos(row.clock_out, row.clock_out_lagos)
                      : "open"}
                    {row.site_name ? ` · ${row.site_name}` : ""}
                  </p>
                  <div className="mt-2">
                    <DeviceDetails row={row} />
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {row.public_ip ? `IP ${row.public_ip}` : "No login address"}
                    </p>
                  </div>
                  {!row.clock_out ? (
                    <LiveElapsed
                      clockIn={row.clock_in}
                      className="mt-1 text-emerald-700"
                    />
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDuration(row.clock_in, row.clock_out)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
