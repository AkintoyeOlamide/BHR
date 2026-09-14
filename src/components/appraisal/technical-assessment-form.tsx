"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AppraisalAlert,
  AppraisalMetricBar,
  AppraisalFormSection,
  AppraisalPanel,
  AppraisalPanelHeader,
  AppraisalStickyFooter,
  AppraisalTableWrap,
  AppraisalToolbar,
  RowRemoveButton,
  SaveButton,
  WeightProgress,
  cellNumberClass,
  cellSelectClass,
  cellTextareaClass,
  cellWrappedReadonlyClass,
} from "@/components/appraisal/appraisal-ui";
import { AssignAppraisalDialog } from "@/components/appraisal/assign-appraisal-dialog";
import {
  KPI_MAX_ROWS,
  KPI_RATING_MAX,
  KPI_RATING_MIN,
  KPI_SECTION_WEIGHT_DEFAULT,
  calculateKpiOverallRating,
  calculateKpiRowScore,
  calculateKpiSectionActual,
  calculateTotalWeight,
  createDefaultKpiRows,
  createEmptyKpiRow,
  distributeWeightsEvenly,
  getKpiEffectiveRating,
  isWeightOverLimit,
  type KpiRow,
} from "@/lib/kpi/calculations";

type TechnicalAssessmentFormProps = {
  appraisalId?: string;
  mode: "manager" | "employee" | "template";
  /** Only the assigned reviewer may edit manager ratings. */
  canEditManagerRating?: boolean;
  /** HR can edit KPI structure; assigned managers rate only. */
  canEditStructure?: boolean;
  /** When true, staff cannot change their own ratings (already assigned). */
  locked?: boolean;
  showAssign?: boolean;
  header: {
    appraisee_name: string;
    department: string;
    review_period: string;
    appraiser_name: string;
    job_title: string;
    time_in_present_position: string;
    kpi_section_weight: number;
  };
  initialKpis: KpiRow[];
};

function toKpiRows(raw: KpiRow[]): KpiRow[] {
  if (raw.length === 0) return createDefaultKpiRows(1);
  return raw.map((kpi, index) => ({
    id: kpi.id,
    sort_order: index + 1,
    task: kpi.task ?? "",
    weight: Number(kpi.weight) || 0,
    rating: kpi.rating ?? null,
    manager_rating: kpi.manager_rating ?? null,
    measurement_area: kpi.measurement_area ?? "",
  }));
}

export function TechnicalAssessmentForm({
  appraisalId,
  mode,
  canEditManagerRating: canEditManagerRatingProp,
  canEditStructure: canEditStructureProp,
  locked = false,
  showAssign = false,
  header,
  initialKpis,
}: TechnicalAssessmentFormProps) {
  const router = useRouter();
  const isTemplate = mode === "template";
  const isManager = mode === "manager" || isTemplate;
  const isEmployee = mode === "employee";
  const canEditStaffRating = isEmployee && !locked;
  const canEditManagerRating =
    canEditManagerRatingProp ?? mode === "manager";
  const canEditStructure =
    canEditStructureProp ?? (isTemplate || (isManager && !canEditManagerRatingProp));
  const ratingOnlyManager = isManager && canEditManagerRating && !canEditStructure;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [formHeader, setFormHeader] = useState({
    appraisee_name: header.appraisee_name,
    department: header.department,
    review_period: header.review_period,
    appraiser_name: header.appraiser_name,
    job_title: header.job_title,
    time_in_present_position: header.time_in_present_position,
    kpi_section_weight: header.kpi_section_weight || KPI_SECTION_WEIGHT_DEFAULT,
  });

  const [kpis, setKpis] = useState<KpiRow[]>(() => toKpiRows(initialKpis));

  const totalWeight = useMemo(() => calculateTotalWeight(kpis), [kpis]);
  const overallRating = useMemo(() => calculateKpiOverallRating(kpis), [kpis]);
  const sectionActual = useMemo(
    () => calculateKpiSectionActual(overallRating, formHeader.kpi_section_weight),
    [overallRating, formHeader.kpi_section_weight]
  );
  const weightsOk = !isWeightOverLimit(kpis);

  function updateKpi(index: number, field: keyof KpiRow, value: string) {
    setKpis((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        if (field === "weight") {
          const parsed = parseFloat(value) || 0;
          const otherTotal = rows.reduce(
            (sum, r, j) => (j === index ? sum : sum + r.weight),
            0
          );
          const maxAllowed = Math.max(0, 100 - otherTotal);
          return { ...row, weight: Math.min(parsed, maxAllowed) };
        }
        if (field === "rating" || field === "manager_rating") {
          return { ...row, [field]: value === "" ? null : Number(value) };
        }
        return { ...row, [field]: value };
      })
    );
  }

  function addKpiRow() {
    if (kpis.length >= KPI_MAX_ROWS) return;
    setKpis((rows) => [
      ...rows,
      createEmptyKpiRow(rows.length + 1, 0),
    ]);
  }

  function removeKpiRow(index: number) {
    if (kpis.length <= 1) return;
    setKpis((rows) =>
      rows
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, sort_order: i + 1 }))
    );
  }

  function distributeEvenly() {
    const weights = distributeWeightsEvenly(kpis.length);
    setKpis((rows) =>
      rows.map((row, index) => ({ ...row, weight: weights[index] }))
    );
  }

  async function handleSave() {
    if (canEditStructure && isWeightOverLimit(kpis)) {
      setMessage(
        `Total weight cannot exceed 100%. Right now it is ${totalWeight.toFixed(2)}%.`
      );
      return;
    }

    setLoading(true);
    setMessage(null);

    const url = isTemplate
      ? "/api/kpi-template"
      : `/api/appraisals/${appraisalId}/kpis`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formHeader,
        kpis,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Could not save technical assessment.");
      return;
    }

    setMessage(
      isTemplate
        ? "Form template saved. New employee appraisals will use this layout."
        : "Technical assessment saved."
    );
    router.refresh();
  }

  return (
    <AppraisalPanel accent="violet">
      <AppraisalPanelHeader
        accent="violet"
        badge={`${formHeader.kpi_section_weight}% of total`}
        title="Technical KPI assessment"
        subtitle={
          ratingOnlyManager
            ? "Review each KPI and enter your manager rating. Staff ratings are shown for reference."
            : "Define key performance indicators, assign weights, and rate each task. Weights across all rows cannot exceed 100%."
        }
      />

      {ratingOnlyManager && (
        <div className="mx-3 mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-950 sm:mx-4 md:mx-6 lg:mx-8">
          Enter a <strong>Manager rating</strong> (1–5) on every row, then
          save. Use Overall to save the band — the employee submits to HR.
        </div>
      )}

      <AppraisalFormSection title="Employee details" accent="violet">
        <Input
          variant="form"
          label="Appraisee's name"
          value={formHeader.appraisee_name}
          onChange={(e) =>
            setFormHeader((h) => ({ ...h, appraisee_name: e.target.value }))
          }
          readOnly={!canEditStructure}
          placeholder="Full name"
        />
        <Input
          variant="form"
          label="Appraiser's name"
          value={formHeader.appraiser_name}
          onChange={(e) =>
            setFormHeader((h) => ({ ...h, appraiser_name: e.target.value }))
          }
          readOnly={!canEditStructure}
          placeholder="Manager or reviewer"
        />
        <Input
          variant="form"
          label="Department"
          value={formHeader.department}
          onChange={(e) =>
            setFormHeader((h) => ({ ...h, department: e.target.value }))
          }
          readOnly={!canEditStructure}
          placeholder="e.g. Comms & IT"
        />
        <Input
          variant="form"
          label="Designation"
          value={formHeader.job_title}
          onChange={(e) =>
            setFormHeader((h) => ({ ...h, job_title: e.target.value }))
          }
          readOnly={!canEditStructure}
          placeholder="Job title"
        />
        <Input
          variant="form"
          label="Appraisal period"
          value={formHeader.review_period}
          onChange={(e) =>
            setFormHeader((h) => ({ ...h, review_period: e.target.value }))
          }
          readOnly={!canEditStructure}
          placeholder="e.g. Jan – Dec 2026"
        />
        <Input
          variant="form"
          label="Time in present position"
          value={formHeader.time_in_present_position}
          onChange={(e) =>
            setFormHeader((h) => ({
              ...h,
              time_in_present_position: e.target.value,
            }))
          }
          readOnly={!canEditStructure}
          placeholder="e.g. 2 years"
        />
      </AppraisalFormSection>

      {isManager ? (
        <AppraisalMetricBar
          metrics={[
            { label: "Section weight", value: `${formHeader.kpi_section_weight}%` },
            {
              label: "Section score",
              value: sectionActual.toFixed(2),
              highlight: true,
            },
            { label: "Row total", value: overallRating.toFixed(2) },
          ]}
        />
      ) : (
        <div className="mx-3 mb-2 rounded-lg bg-slate-50 px-3 py-2.5 sm:mx-4 sm:px-4 sm:py-3 md:mx-6 lg:mx-8">
          <p className="text-sm text-slate-600">
            Review each KPI below. KPI text, weights, and measurement areas are
            set by HR — enter your staff rating for each row, then save. Manager
            rating is filled in by your reviewer.
          </p>
        </div>
      )}

      {canEditStructure && (
        <AppraisalToolbar
          hint={`Up to ${KPI_MAX_ROWS} rows · max 100% total weight`}
        >
          <Button type="button" variant="secondary" onClick={addKpiRow}>
            + Add row
          </Button>
          <Button type="button" variant="secondary" onClick={distributeEvenly}>
            Split weights evenly
          </Button>
          <WeightProgress total={totalWeight} />
        </AppraisalToolbar>
      )}

      <AppraisalTableWrap title="KPI rows" accent="violet">
        <table className="appraisal-data-table w-full border-collapse text-xs md:text-sm">
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "7%" }} />
            {isManager && canEditStructure && <col style={{ width: "4%" }} />}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-3 text-center md:px-3">No.</th>
              <th className="px-2 py-3 text-left md:px-3">
                Key performance indicator
              </th>
              <th className="px-2 py-3 text-center">Weight</th>
              <th className="px-2 py-3 text-center">Staff rating</th>
              <th
                className={`px-2 py-3 text-center ${
                  ratingOnlyManager ? "text-indigo-700" : ""
                }`}
              >
                Manager rating
              </th>
              <th className="px-2 py-3 text-left md:px-3">Measurement area</th>
              <th className="px-2 py-3 text-center">Score</th>
              {isManager && canEditStructure && <th className="px-1 py-3" />}
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi, index) => {
              const rowScore = calculateKpiRowScore(
                kpi.weight,
                getKpiEffectiveRating(kpi)
              );
              return (
                <tr key={kpi.id ?? index} className="border-b border-slate-100">
                  <td
                    data-label={`KPI ${index + 1}`}
                    className="appraisal-cell-index px-2 py-2 text-center text-xs font-medium text-slate-400 md:px-3"
                  >
                    {index + 1}
                  </td>
                  <td
                    data-label="Key performance indicator"
                    className="appraisal-cell-text p-1.5 md:p-2"
                  >
                    <textarea
                      value={kpi.task}
                      onChange={(e) => updateKpi(index, "task", e.target.value)}
                      readOnly={!canEditStructure}
                      rows={3}
                      className={
                        canEditStructure
                          ? cellTextareaClass
                          : cellWrappedReadonlyClass
                      }
                    />
                  </td>
                  <td
                    data-label="Weight"
                    className="appraisal-cell-weight p-1.5 md:p-2"
                  >
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        inputMode="decimal"
                        value={kpi.weight === 0 ? "" : kpi.weight}
                        onChange={(e) =>
                          updateKpi(index, "weight", e.target.value)
                        }
                        readOnly={!canEditStructure}
                        className={cellNumberClass}
                      />
                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        %
                      </span>
                    </div>
                  </td>
                  <td
                    data-label="Staff rating"
                    className="appraisal-cell-rating p-1.5 md:p-2"
                  >
                    <select
                      value={kpi.rating ?? ""}
                      onChange={(e) =>
                        updateKpi(index, "rating", e.target.value)
                      }
                      disabled={!canEditStaffRating}
                      className={cellSelectClass}
                    >
                      <option value="">—</option>
                      {Array.from(
                        { length: KPI_RATING_MAX - KPI_RATING_MIN + 1 },
                        (_, i) => KPI_RATING_MIN + i
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    data-label="Manager rating"
                    className={`appraisal-cell-rating p-1.5 md:p-2 ${
                      ratingOnlyManager ? "rounded-lg bg-indigo-50/80" : ""
                    }`}
                  >
                    <select
                      value={kpi.manager_rating ?? ""}
                      onChange={(e) =>
                        updateKpi(index, "manager_rating", e.target.value)
                      }
                      disabled={!canEditManagerRating}
                      className={cellSelectClass}
                    >
                      <option value="">—</option>
                      {Array.from(
                        { length: KPI_RATING_MAX - KPI_RATING_MIN + 1 },
                        (_, i) => KPI_RATING_MIN + i
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    data-label="Measurement area"
                    className="appraisal-cell-text p-1.5 md:p-2"
                  >
                    <textarea
                      value={kpi.measurement_area}
                      onChange={(e) =>
                        updateKpi(index, "measurement_area", e.target.value)
                      }
                      readOnly={!canEditStructure}
                      rows={3}
                      className={
                        canEditStructure
                          ? cellTextareaClass
                          : cellWrappedReadonlyClass
                      }
                    />
                  </td>
                  <td
                    data-label="Score"
                    className="appraisal-cell-score px-2 py-2 text-center text-sm font-semibold tabular-nums text-slate-800"
                  >
                    {rowScore.toFixed(2)}
                  </td>
                  {canEditStructure && (
                    <td className="appraisal-cell-actions px-1 py-2 text-center">
                      <RowRemoveButton onClick={() => removeKpiRow(index)} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-semibold">
              <td
                colSpan={2}
                className="hidden px-4 py-3 text-right text-slate-600 md:table-cell"
              >
                Total weighting
              </td>
              <td
                data-label="Total weight"
                className={`appraisal-cell-weight px-2 py-3 text-center tabular-nums ${
                  weightsOk ? "text-slate-900" : "text-red-600"
                }`}
              >
                {totalWeight.toFixed(2)}%
              </td>
              <td colSpan={3} className="hidden md:table-cell" />
              <td
                data-label="Overall score"
                className="appraisal-cell-score px-2 py-3 text-center tabular-nums text-slate-900"
              >
                {overallRating.toFixed(2)}
              </td>
              {canEditStructure && <td className="hidden md:table-cell" />}
            </tr>
          </tfoot>
        </table>
      </AppraisalTableWrap>

      <div className="space-y-3 px-3 pt-3 md:px-6 md:pt-4 lg:px-8">
        {!weightsOk && canEditStructure && (
          <AppraisalAlert variant="error">
            Total weight cannot exceed 100%. Current total:{" "}
            {totalWeight.toFixed(2)}%.
          </AppraisalAlert>
        )}
        {message && (
          <AppraisalAlert variant="success">{message}</AppraisalAlert>
        )}
      </div>

      <AppraisalStickyFooter
        helper={
          isEmployee
            ? locked
              ? "Staff ratings are locked. Manager ratings appear in the Manager rating column as they are saved."
              : "Enter your staff rating for each KPI, then save. Manager rating is set by your assigned manager."
            : canEditManagerRating
              ? "Enter your manager rating on each row, then save. Continue to Behavioural, then Overall to save the rating band. Staff submits to HR."
              : "You can edit KPI structure. Only the assigned manager can enter manager ratings."
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {(!isEmployee || !locked) && (
            <SaveButton
              loading={loading}
              label={
                isTemplate ? "Save template" : "Save technical section"
              }
              onClick={handleSave}
            />
          )}
          {showAssign && (
            <AssignAppraisalDialog onSuccess={setMessage} />
          )}
        </div>
      </AppraisalStickyFooter>
    </AppraisalPanel>
  );
}
