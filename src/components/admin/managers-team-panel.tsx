"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROLES, roleLabel } from "@/lib/auth/roles";

export type TeamMember = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  job_title: string | null;
  manager_id: string | null;
  manager_name: string | null;
};

const selectClass =
  "h-10 w-full min-w-[10rem] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-slate-50 disabled:text-slate-400";

export function ManagersTeamPanel({
  initialStaff,
}: {
  initialStaff: TeamMember[];
}) {
  const router = useRouter();
  const [staff, setStaff] = useState<TeamMember[]>(initialStaff);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStaff(initialStaff);
  }, [initialStaff]);

  useEffect(() => {
    fetch("/api/employees", { credentials: "same-origin" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "Could not load staff.");
        }
        return body as { employees?: TeamMember[] };
      })
      .then((body) => {
        if (Array.isArray(body.employees)) {
          setStaff(
            body.employees.map((m) => ({
              ...m,
              manager_id: m.manager_id ?? null,
              manager_name: m.manager_name ?? null,
            }))
          );
        }
      })
      .catch(() => {
        // Keep server-rendered list.
      });
  }, []);

  const managers = useMemo(
    () =>
      staff.filter((m) => {
        const role = (m.role ?? "").toLowerCase();
        const email = (m.email ?? "").toLowerCase();
        return (
          role === ROLES.HR_MANAGER &&
          email !== "hr@bhr.com" &&
          email !== "admin@bhr.com"
        );
      }),
    [staff]
  );

  const employees = useMemo(
    () =>
      staff.filter((m) => (m.role ?? "").toLowerCase() === ROLES.EMPLOYEE),
    [staff]
  );

  const unassigned = useMemo(
    () => employees.filter((m) => !m.manager_id),
    [employees]
  );

  const teams = useMemo(() => {
    return managers.map((manager) => ({
      manager,
      reports: employees.filter((e) => e.manager_id === manager.id),
    }));
  }, [managers, employees]);

  async function refreshFromApi() {
    const response = await fetch("/api/employees", {
      credentials: "same-origin",
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(body.employees)) {
      setStaff(
        body.employees.map((m: TeamMember) => ({
          ...m,
          manager_id: m.manager_id ?? null,
          manager_name: m.manager_name ?? null,
        }))
      );
    }
    router.refresh();
  }

  async function updateRole(member: TeamMember, role: string) {
    setLoadingId(member.id);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        id: member.id,
        email: member.email,
        full_name: member.full_name,
        department: member.department,
        job_title: member.job_title,
        role,
      }),
    });

    setLoadingId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not update role.");
      return;
    }

    setMessage(
      role === ROLES.HR_MANAGER
        ? `${member.full_name} is now a manager. Assign staff to them below.`
        : `${member.full_name} is now an employee.`
    );
    await refreshFromApi();
  }

  async function assignManager(member: TeamMember, managerId: string) {
    setLoadingId(member.id);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        id: member.id,
        manager_id: managerId || null,
      }),
    });

    setLoadingId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not assign manager.");
      return;
    }

    const body = await response.json().catch(() => ({}));
    if (managerId) {
      setMessage(
        `${member.full_name} now reports to ${body.manager_name ?? "their manager"}. Only that manager can enter manager ratings.`
      );
    } else {
      setMessage(`${member.full_name} no longer has an assigned manager.`);
    }
    await refreshFromApi();
  }

  return (
    <div className="space-y-8">
      <div className="portal-stat-grid">
        <div className="portal-stat-tile portal-stat-tile--violet">
          <p className="portal-stat-value">{managers.length}</p>
          <p className="portal-stat-label">Managers</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--blue">
          <p className="portal-stat-value">{employees.length}</p>
          <p className="portal-stat-label">Staff</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--rose">
          <p className="portal-stat-value">{unassigned.length}</p>
          <p className="portal-stat-label">Unassigned</p>
        </div>
      </div>

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Promote people to manager, then assign each employee to a manager.
        Once assigned, only that manager can enter the staff&apos;s{" "}
        <span className="font-medium text-slate-800">manager rating</span> on
        appraisals. HR can still set up KPIs and view results.
      </p>

      {message && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Make someone a manager
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Managers get access to the manager portal for their assigned team.
          </p>
        </div>

        <div className="portal-card overflow-hidden">
          <table className="appraisal-data-table w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 md:px-5">Name</th>
                <th className="px-4 py-3 md:px-5">Email</th>
                <th className="px-4 py-3 md:px-5">Department</th>
                <th className="px-4 py-3 md:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No employees left to promote. Demote a manager below if
                    needed.
                  </td>
                </tr>
              ) : (
                employees.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60">
                    <td
                      data-label="Name"
                      className="px-4 py-3 font-medium text-slate-900 md:px-5"
                    >
                      {member.full_name}
                    </td>
                    <td
                      data-label="Email"
                      className="px-4 py-3 text-slate-600 md:px-5"
                    >
                      {member.email || "—"}
                    </td>
                    <td
                      data-label="Department"
                      className="px-4 py-3 text-slate-600 md:px-5"
                    >
                      {member.department ?? "—"}
                    </td>
                    <td
                      data-label="Action"
                      className="px-4 py-3 text-right md:px-5"
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={loadingId === member.id}
                        onClick={() => updateRole(member, ROLES.HR_MANAGER)}
                        className="h-9 px-3 text-xs"
                      >
                        {loadingId === member.id ? "Saving…" : "Make manager"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Assign staff to a manager
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Open appraisals for that person will use this manager as the
            reviewer.
          </p>
        </div>

        {managers.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Promote at least one person to manager before assigning teams.
          </p>
        ) : (
          <div className="portal-card overflow-hidden">
            <table className="appraisal-data-table w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 md:px-5">Staff</th>
                  <th className="px-4 py-3 md:px-5">Department</th>
                  <th className="px-4 py-3 md:px-5">Reports to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60">
                    <td
                      data-label="Staff"
                      className="px-4 py-3 md:px-5"
                    >
                      <p className="font-medium text-slate-900">
                        {member.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.email || "—"}
                      </p>
                    </td>
                    <td
                      data-label="Department"
                      className="px-4 py-3 text-slate-600 md:px-5"
                    >
                      {member.department ?? "—"}
                    </td>
                    <td
                      data-label="Reports to"
                      className="px-4 py-3 md:px-5"
                    >
                      <select
                        className={selectClass}
                        value={member.manager_id ?? ""}
                        disabled={loadingId === member.id}
                        onChange={(e) =>
                          assignManager(member, e.target.value)
                        }
                      >
                        <option value="">— Unassigned —</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Manager teams
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Overview of who each manager will rate.
          </p>
        </div>

        {managers.length === 0 ? (
          <p className="text-sm text-slate-500">No managers yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map(({ manager, reports }) => (
              <div
                key={manager.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {manager.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {manager.email || "—"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-sky-700">
                      {roleLabel(manager.role)} · {reports.length} staff
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loadingId === manager.id}
                    onClick={() => updateRole(manager, ROLES.EMPLOYEE)}
                    className="h-8 shrink-0 px-2 text-xs text-slate-500"
                  >
                    Make employee
                  </Button>
                </div>
                {reports.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No staff assigned yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {reports.map((report) => (
                      <li
                        key={report.id}
                        className="flex items-center justify-between gap-2 text-sm text-slate-700"
                      >
                        <span>{report.full_name}</span>
                        <span className="text-xs text-slate-400">
                          {report.department ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
