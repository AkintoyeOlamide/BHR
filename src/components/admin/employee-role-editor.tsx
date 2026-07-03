"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/auth/roles";

type Employee = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  job_title: string | null;
};

export function EmployeeRoleEditor({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateEmployee(employee: Employee, role: string) {
    setLoadingId(employee.id);
    setMessage(null);

    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...employee, role }),
    });

    setLoadingId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Could not update employee.");
      return;
    }

    setMessage(`${employee.full_name} updated to ${roleLabel(role)}.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          {message}
        </p>
      )}
      {employees.map((employee) => (
        <article
          key={employee.id}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-900">{employee.full_name}</h3>
              <p className="text-sm text-slate-500">{employee.email}</p>
              <p className="mt-1 text-xs text-slate-400">
                {employee.job_title ?? "No title"} · {employee.department ?? "No department"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["employee", "hr_manager", "super_admin"].map((role) => (
                <Button
                  key={role}
                  type="button"
                  variant={employee.role === role ? "primary" : "secondary"}
                  disabled={loadingId === employee.id}
                  onClick={() => updateEmployee(employee, role)}
                >
                  {roleLabel(role)}
                </Button>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
