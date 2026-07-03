"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROLES, roleLabel } from "@/lib/auth/roles";

export type StaffMember = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  job_title: string | null;
};

type Filter = "all" | "employees" | "managers";

const roleBadgeClass: Record<string, string> = {
  super_admin: "bg-violet-100 text-violet-800",
  hr_manager: "bg-sky-100 text-sky-800",
  employee: "bg-slate-100 text-slate-700",
};

export function StaffDirectory({
  staff,
  canPromoteToAdmin = false,
}: {
  staff: StaffMember[];
  canPromoteToAdmin?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      employees: staff.filter((m) => m.role === ROLES.EMPLOYEE).length,
      managers: staff.filter((m) => m.role === ROLES.HR_MANAGER).length,
      admins: staff.filter((m) => m.role === ROLES.SUPER_ADMIN).length,
    }),
    [staff]
  );

  const filtered = useMemo(() => {
    if (filter === "employees") {
      return staff.filter((m) => m.role === ROLES.EMPLOYEE);
    }
    if (filter === "managers") {
      return staff.filter(
        (m) => m.role === ROLES.HR_MANAGER || m.role === ROLES.SUPER_ADMIN
      );
    }
    return staff;
  }, [staff, filter]);

  async function updateRole(member: StaffMember, role: string) {
    setLoadingId(member.id);
    setMessage(null);

    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ ...member, role }),
    });

    setLoadingId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Could not update role.");
      return;
    }

    setMessage(`${member.full_name} is now ${roleLabel(role)}.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Employees</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {counts.employees}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
          <p className="text-sm text-sky-700">Managers</p>
          <p className="mt-1 text-2xl font-semibold text-sky-900">
            {counts.managers}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm">
          <p className="text-sm text-violet-700">Admins</p>
          <p className="mt-1 text-2xl font-semibold text-violet-900">
            {counts.admins}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${staff.length})`],
            ["employees", `Employees (${counts.employees})`],
            ["managers", `Managers (${counts.managers + counts.admins})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === key
                ? "bg-violet-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Job title</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No staff in this view.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const isProtected =
                    member.email === "hr@bhr.com" ||
                    member.email === "admin@bhr.com";
                  const isManager =
                    member.role === ROLES.HR_MANAGER ||
                    member.role === ROLES.SUPER_ADMIN;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {member.full_name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {member.email}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {member.department ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {member.job_title ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            roleBadgeClass[member.role] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {roleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {isProtected ? (
                            <span className="text-xs text-slate-400">
                              Protected
                            </span>
                          ) : member.role === ROLES.EMPLOYEE ? (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={loadingId === member.id}
                              onClick={() =>
                                updateRole(member, ROLES.HR_MANAGER)
                              }
                              className="h-9 px-3 text-xs"
                            >
                              {loadingId === member.id
                                ? "Saving…"
                                : "Make manager"}
                            </Button>
                          ) : isManager && member.role !== ROLES.SUPER_ADMIN ? (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={loadingId === member.id}
                              onClick={() => updateRole(member, ROLES.EMPLOYEE)}
                              className="h-9 px-3 text-xs"
                            >
                              {loadingId === member.id
                                ? "Saving…"
                                : "Make employee"}
                            </Button>
                          ) : canPromoteToAdmin ? (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={loadingId === member.id}
                              onClick={() =>
                                updateRole(member, ROLES.SUPER_ADMIN)
                              }
                              className="h-9 px-3 text-xs"
                            >
                              Make admin
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
