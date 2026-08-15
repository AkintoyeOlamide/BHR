import { ONBOARDING_DEPARTMENTS } from "@/lib/onboarding/content";
import type { OnboardingLearnerSnapshot } from "@/lib/onboarding/progress";

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function departmentName(id: string | null) {
  if (!id) return "—";
  return ONBOARDING_DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

type Props = {
  rows: OnboardingLearnerSnapshot[];
};

export function OnboardingProgressTable({ rows }: Props) {
  const totalDepartments = ONBOARDING_DEPARTMENTS.length;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
        <p className="text-sm font-medium text-slate-800">No learners yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Progress will appear here when staff enter their name and email on
          `/onboarding`.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Staff</th>
            <th className="px-4 py-3">Currently on</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Departments done</th>
            <th className="px-4 py-3">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ learner, progress }) => {
            const completed = progress.filter((p) => p.status === "completed");
            const inProgress = progress.filter(
              (p) => p.status === "in_progress"
            );
            return (
              <tr
                key={learner.id}
                className="border-b border-slate-100 align-top last:border-0"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-900">
                    {learner.full_name}
                  </p>
                  <p className="mt-0.5 text-slate-500">{learner.email}</p>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  <p>{departmentName(learner.current_department_id)}</p>
                  {learner.current_lesson_id ? (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Lesson: {learner.current_lesson_id}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-800">
                    {completed.length}/{totalDepartments} complete
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {inProgress.length} in progress
                  </p>
                </td>
                <td className="px-4 py-4">
                  {completed.length === 0 ? (
                    <span className="text-slate-400">None yet</span>
                  ) : (
                    <ul className="space-y-1">
                      {completed.map((item) => (
                        <li
                          key={`${learner.id}-${item.department_id}`}
                          className="text-slate-700"
                        >
                          {departmentName(item.department_id)}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                  {formatWhen(learner.last_seen_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
