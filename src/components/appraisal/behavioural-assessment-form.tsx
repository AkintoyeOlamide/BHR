"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AppraisalAlert,
  AppraisalMetricBar,
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
import {
  BEHAVIOURAL_MAX_ROWS,
  BEHAVIOURAL_RATING_MAX,
  BEHAVIOURAL_RATING_MIN,
  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
  calculateBehaviouralOverallRating,
  calculateBehaviouralRowScore,
  calculateBehaviouralSectionActual,
  calculateBehaviouralTotalWeight,
  createDefaultBehaviouralRows,
  createEmptyBehaviouralRow,
  distributeBehaviouralWeightsEvenly,
  getBehaviouralEffectiveRating,
  isBehaviouralWeightOverLimit,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";

type BehaviouralAssessmentFormProps = {
  appraisalId?: string;
  mode: "manager" | "employee" | "template";
  /** Only the assigned reviewer may edit manager ratings. */
  canEditManagerRating?: boolean;
  /** HR can edit structure; assigned managers rate only. */
  canEditStructure?: boolean;
  /** When true, staff cannot change their own ratings (already assigned). */
  locked?: boolean;
  sectionWeight: number;
  initialItems: BehaviouralRow[];
};

function toBehaviouralRows(raw: BehaviouralRow[]): BehaviouralRow[] {
  if (raw.length === 0) return createDefaultBehaviouralRows(1);
  return raw.map((item, index) => ({
    id: item.id,
    sort_order: index + 1,
    key_measurement: item.key_measurement ?? "",
    weight: Number(item.weight) || 0,
    rating: item.rating ?? null,
    manager_rating: item.manager_rating ?? null,
    comments: item.comments ?? "",
  }));
}

export function BehaviouralAssessmentForm({
  appraisalId,
  mode,
  canEditManagerRating: canEditManagerRatingProp,
  canEditStructure: canEditStructureProp,
  locked = false,
  sectionWeight,
  initialItems,
}: BehaviouralAssessmentFormProps) {
  const router = useRouter();
  const isTemplate = mode === "template";
  const isManager = mode === "manager" || isTemplate;
  const isEmployee = mode === "employee";
  const canEditStaffRating = isEmployee && !locked;
  const canEditManagerRating =
    canEditManagerRatingProp ?? mode === "manager";
  const canEditStructure =
    canEditStructureProp ??
    (isTemplate || (isManager && !canEditManagerRatingProp));
  const ratingOnlyManager =
    isManager && canEditManagerRating && !canEditStructure;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [formSectionWeight] = useState(
    sectionWeight || BEHAVIOURAL_SECTION_WEIGHT_DEFAULT
  );
  const [items, setItems] = useState<BehaviouralRow[]>(() =>
    toBehaviouralRows(initialItems)
  );

  const totalWeight = useMemo(
    () => calculateBehaviouralTotalWeight(items),
    [items]
  );
  const overallRating = useMemo(
    () => calculateBehaviouralOverallRating(items),
    [items]
  );
  const sectionActual = useMemo(
    () => calculateBehaviouralSectionActual(overallRating, formSectionWeight),
    [overallRating, formSectionWeight]
  );
  const weightsOk = !isBehaviouralWeightOverLimit(items);

  function updateItem(index: number, field: keyof BehaviouralRow, value: string) {
    setItems((rows) =>
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

  function addRow() {
    if (items.length >= BEHAVIOURAL_MAX_ROWS) return;
    setItems((rows) => [...rows, createEmptyBehaviouralRow(rows.length + 1, 0)]);
  }

  function removeRow(index: number) {
    if (items.length <= 1) return;
    setItems((rows) =>
      rows
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, sort_order: i + 1 }))
    );
  }

  function distributeEvenly() {
    const weights = distributeBehaviouralWeightsEvenly(items.length);
    setItems((rows) =>
      rows.map((row, index) => ({ ...row, weight: weights[index] }))
    );
  }

  async function handleSave() {
    if (canEditStructure && isBehaviouralWeightOverLimit(items)) {
      setMessage(
        `Total weight cannot exceed 100%. Right now it is ${totalWeight.toFixed(2)}%.`
      );
      return;
    }

    setLoading(true);
    setMessage(null);

    const url = isTemplate
      ? "/api/behavioural-template"
      : `/api/appraisals/${appraisalId}/behavioural`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        behavioural_section_weight: formSectionWeight,
        behavioural_items: items,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Could not save behavioural assessment.");
      return;
    }

    setMessage(
      isTemplate
        ? "Behavioural form template saved."
        : "Behavioural assessment saved."
    );
    router.refresh();
  }

  return (
    <AppraisalPanel accent="sky">
      <AppraisalPanelHeader
        accent="sky"
        badge={`${formSectionWeight}% of total`}
        title="Behavioural skills & competence"
        subtitle={
          isEmployee
            ? "Review each behaviour below. Text and weights are set by HR — enter your staff rating for each row. Manager rating is filled in by your assigned manager."
            : ratingOnlyManager
              ? "Enter your manager rating for each behaviour. Staff ratings are shown for reference."
              : canEditManagerRating
                ? "Enter your manager rating for each behaviour. Staff ratings are shown for reference. Include specific examples in comments."
                : "You can edit behavioural structure and comments. Only the assigned manager can enter manager ratings."
        }
      />

      {ratingOnlyManager && (
        <div className="mx-3 mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-950 sm:mx-4 md:mx-6 lg:mx-8">
          Enter a <strong>Manager rating</strong> (1–5) on every row, then
          save. Use Overall to save the band — the employee submits to HR.
        </div>
      )}

      {isManager ? (
        <AppraisalMetricBar
          metrics={[
            { label: "Section weight", value: `${formSectionWeight}%` },
            {
              label: "Section score",
              value: sectionActual.toFixed(2),
              highlight: true,
            },
            { label: "Row total", value: overallRating.toFixed(2) },
          ]}
        />
      ) : (
        <div className="border-b border-slate-100 px-0 py-3 md:px-6 lg:px-8">
          <p className="text-xs text-slate-600 md:text-sm">
            Select a staff rating for each behaviour. Other fields are set by HR
            and cannot be changed.
          </p>
        </div>
      )}

      {canEditStructure && (
        <AppraisalToolbar
          hint={`Up to ${BEHAVIOURAL_MAX_ROWS} rows · max 100% total weight`}
        >
          <Button type="button" variant="secondary" onClick={addRow}>
            + Add row
          </Button>
          <Button type="button" variant="secondary" onClick={distributeEvenly}>
            Split weights evenly
          </Button>
          <WeightProgress total={totalWeight} />
        </AppraisalToolbar>
      )}

      <AppraisalTableWrap title="Behavioural competencies" accent="sky">
        <table className="appraisal-data-table w-full border-collapse text-xs md:text-sm">
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "32%" }} />
            <col style={{ width: "7%" }} />
            {canEditStructure && <col style={{ width: "4%" }} />}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-3 text-center md:px-3">No.</th>
              <th className="px-2 py-3 text-left md:px-3">Key measurement</th>
              <th className="px-2 py-3 text-center">Weight</th>
              <th className="px-2 py-3 text-center">Staff rating</th>
              <th
                className={`px-2 py-3 text-center ${
                  ratingOnlyManager ? "text-sky-700" : ""
                }`}
              >
                Manager rating
              </th>
              <th className="px-2 py-3 text-left md:px-3">
                Comments
                <span className="mt-1 hidden text-[10px] font-normal normal-case tracking-normal text-slate-400 sm:block">
                  {isEmployee
                    ? "Set by HR / manager"
                    : "Be specific — give one real example"}
                </span>
              </th>
              <th className="px-2 py-3 text-center">Score</th>
              {canEditStructure && <th className="px-1 py-3" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rowScore = calculateBehaviouralRowScore(
                item.weight,
                getBehaviouralEffectiveRating(item)
              );
              return (
                <tr key={item.id ?? index} className="border-b border-slate-100">
                  <td
                    data-label={`Item ${index + 1}`}
                    className="appraisal-cell-index px-2 py-2 text-center text-xs font-medium text-slate-400 md:px-3"
                  >
                    {index + 1}
                  </td>
                  <td
                    data-label="Key measurement"
                    className="appraisal-cell-text p-1.5 md:p-2"
                  >
                    <textarea
                      value={item.key_measurement}
                      onChange={(e) =>
                        updateItem(index, "key_measurement", e.target.value)
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
                        value={item.weight === 0 ? "" : item.weight}
                        onChange={(e) =>
                          updateItem(index, "weight", e.target.value)
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
                      value={item.rating ?? ""}
                      onChange={(e) =>
                        updateItem(index, "rating", e.target.value)
                      }
                      disabled={!canEditStaffRating}
                      className={cellSelectClass}
                    >
                      <option value="">—</option>
                      {Array.from(
                        {
                          length:
                            BEHAVIOURAL_RATING_MAX - BEHAVIOURAL_RATING_MIN + 1,
                        },
                        (_, i) => BEHAVIOURAL_RATING_MIN + i
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
                      ratingOnlyManager ? "rounded-lg bg-sky-50/80" : ""
                    }`}
                  >
                    <select
                      value={item.manager_rating ?? ""}
                      onChange={(e) =>
                        updateItem(index, "manager_rating", e.target.value)
                      }
                      disabled={!canEditManagerRating}
                      className={cellSelectClass}
                    >
                      <option value="">—</option>
                      {Array.from(
                        {
                          length:
                            BEHAVIOURAL_RATING_MAX - BEHAVIOURAL_RATING_MIN + 1,
                        },
                        (_, i) => BEHAVIOURAL_RATING_MIN + i
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    data-label="Comments"
                    className="appraisal-cell-text p-1.5 md:p-2"
                  >
                    <textarea
                      value={item.comments}
                      onChange={(e) =>
                        updateItem(index, "comments", e.target.value)
                      }
                      readOnly={!isManager}
                      rows={3}
                      className={
                        isManager ? cellTextareaClass : cellWrappedReadonlyClass
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
                      <RowRemoveButton onClick={() => removeRow(index)} />
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
                data-label="Section score"
                className="appraisal-cell-score px-2 py-3 text-center tabular-nums text-violet-700"
              >
                {sectionActual.toFixed(2)}
              </td>
              {canEditStructure && <td className="hidden md:table-cell" />}
            </tr>
          </tfoot>
        </table>
      </AppraisalTableWrap>

      <div className="space-y-3 px-0 pt-4 md:px-6 lg:px-8">
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
              : "Enter your staff rating for each behaviour, then save. Manager rating is set by your assigned manager."
            : canEditManagerRating
              ? `Score uses manager rating when set, otherwise staff rating · Section = ${formSectionWeight}% of overall. Staff submits to HR.`
              : "Only the assigned manager can enter manager ratings."
        }
      >
        {(!isEmployee || !locked) && (
          <SaveButton
            loading={loading}
            label={isTemplate ? "Save template" : "Save behavioural section"}
            onClick={handleSave}
          />
        )}
      </AppraisalStickyFooter>
    </AppraisalPanel>
  );
}
