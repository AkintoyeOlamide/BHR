"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BerpAvatar } from "@/components/berp/berp-avatar";
import {
  IconAttendance,
  IconBell,
  IconDashboard,
  IconLeave,
  IconMenu,
  IconReports,
  IconSearch,
  IconSettings,
  IconStaff,
  IconUpdates,
} from "@/components/berp/berp-icons";
import { BerpSidebarClock } from "@/components/berp/berp-sidebar-clock";
import { createClient } from "@/lib/supabase/client";

export type BerpView =
  | "dashboard"
  | "attendance"
  | "live"
  | "late"
  | "leave"
  | "updates"
  | "staff"
  | "reports"
  | "settings";

const BERP_VIEWS: BerpView[] = [
  "dashboard",
  "attendance",
  "live",
  "late",
  "leave",
  "updates",
  "staff",
  "reports",
  "settings",
];

export function parseBerpView(value?: string | null): BerpView {
  if (value && BERP_VIEWS.includes(value as BerpView)) return value as BerpView;
  return "dashboard";
}

export function berpHref(view: BerpView) {
  return view === "dashboard" ? "/berp" : `/berp?view=${view}`;
}

export type BerpViewer = {
  full_name: string;
  email: string;
  department: string | null;
  job_title: string | null;
  roleLabel: string;
  homeHref: string;
};

export type BerpNotice = {
  id: string;
  title: string;
  detail: string;
  view: BerpView;
};

const NAV: {
  id: BerpView;
  label: string;
  icon: typeof IconDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: IconDashboard },
  { id: "attendance", label: "Attendance", icon: IconAttendance },
  { id: "leave", label: "Leave", icon: IconLeave },
  { id: "updates", label: "Updates", icon: IconUpdates },
  { id: "staff", label: "Staff", icon: IconStaff },
  { id: "reports", label: "Reports", icon: IconReports },
  { id: "settings", label: "Settings", icon: IconSettings },
];

const TITLES: Record<BerpView, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Staff Dashboard",
    subtitle: "Here's what's happening across the team today.",
  },
  attendance: {
    title: "Attendance",
    subtitle: "Full clock history with device, login address, and duration.",
  },
  live: {
    title: "Currently live",
    subtitle: "Everyone on the clock right now, with device and login address.",
  },
  late: {
    title: "Late today",
    subtitle: "Staff who clocked in after 09:00 WAT, with full session details.",
  },
  leave: {
    title: "Leave",
    subtitle: "Pending and approved leave across BERP staff.",
  },
  updates: {
    title: "Updates",
    subtitle: "Latest announcements and staff notes.",
  },
  staff: {
    title: "Staff",
    subtitle: "Everyone who has used BERP, with live status.",
  },
  reports: {
    title: "Reports",
    subtitle: "Today's punctuality, presence, and exceptions.",
  },
  settings: {
    title: "Settings",
    subtitle: "Push texts, reminders, and portal access.",
  },
};

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

export function BerpShell({
  viewer,
  view,
  onViewChange,
  search,
  onSearchChange,
  notices,
  children,
}: {
  viewer: BerpViewer;
  view: BerpView;
  onViewChange: (view: BerpView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  notices: BerpNotice[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"user" | "bell" | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const copy = TITLES[view];

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setOpenMenu(null);
  }, [view]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const subtitle =
    viewer.department || viewer.job_title || viewer.roleLabel;

  return (
    <div className="berp-app">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`berp-sidebar ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center gap-3 px-2">
          <span className="berp-mark" aria-hidden>
            B
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-[0.18em] text-white">
              BERP
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">
              Bitachon
            </p>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-1.5" aria-label="BERP">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.id === "attendance"
                ? view === "attendance" || view === "live" || view === "late"
                : view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onViewChange(item.id)}
                className={`berp-nav-item ${active ? "berp-nav-item--active" : ""}`}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </nav>

        <BerpSidebarClock firstName={firstName(viewer.full_name)} />
      </aside>

      <div className="berp-main">
        <header ref={headerRef} className="berp-topbar">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <IconMenu />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[1.65rem] font-semibold tracking-tight text-slate-900 sm:text-[1.85rem]">
                  {copy.title}
                </h1>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {copy.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="berp-topbar-actions">
            <label className="berp-search">
              <IconSearch className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search staff, leave, or updates..."
                aria-label="Search staff, leave, or updates"
              />
            </label>

            <div className="relative">
              <button
                type="button"
                className="berp-icon-btn"
                aria-label="Notifications"
                onClick={() =>
                  setOpenMenu((current) => (current === "bell" ? null : "bell"))
                }
              >
                <IconBell />
                {notices.length > 0 ? (
                  <span className="berp-badge">{notices.length}</span>
                ) : null}
              </button>
              {openMenu === "bell" ? (
                <div className="berp-popover berp-popover--right w-80">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notifications
                  </p>
                  {notices.length === 0 ? (
                    <p className="px-3 pb-3 text-sm text-slate-500">
                      Nothing new right now.
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-auto pb-1">
                      {notices.map((notice) => (
                        <li key={notice.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2.5 text-left hover:bg-slate-50"
                            onClick={() => onViewChange(notice.view)}
                          >
                            <p className="text-sm font-medium text-slate-900">
                              {notice.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {notice.detail}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                className="berp-user"
                onClick={() =>
                  setOpenMenu((current) => (current === "user" ? null : "user"))
                }
              >
                <BerpAvatar name={viewer.full_name} size="sm" />
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {viewer.full_name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{subtitle}</span>
                </span>
                <svg
                  viewBox="0 0 16 16"
                  className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block"
                  aria-hidden
                >
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {openMenu === "user" ? (
                <div className="berp-popover berp-popover--right w-64">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {viewer.full_name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {viewer.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => router.push(viewer.homeHref)}
                  >
                    Open Bitachon HR
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="berp-content">{children}</div>
      </div>
    </div>
  );
}
