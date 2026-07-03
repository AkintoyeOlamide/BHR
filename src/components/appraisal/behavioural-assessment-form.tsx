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
  cellInputClass,
  cellNumberClass,
  cellSelectClass,
  cellTextareaClass,
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
  isBehaviouralWeightOverLimit,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";

type BehaviouralAssessmentFormProps = {
  appraisalId?: string;
  mode: "manager" | "employee" | "template";
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
    comments: item.comments ?? "",
  }));
}

export function BehaviouralAssessmentForm({
  appraisalId,
  mode,
  sectionWeight,
  initialItems,
}: BehaviouralAssessmentFormProps) {
  const router = useRouter();
  const isTemplate = mode === "template";
  const isManager = mode === "manager" || isTemplate;
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
        if (field === "rating") {
          return { ...row, rating: value === "" ? null : Number(value) };
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
    if (isManager && isBehaviouralWeightOverLimit(items)) {
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
    <AppraisalPanel>
      <AppraisalPanelHeader
        badge={`${formSectionWeight}% of total`}
        title="Behavioural skills & competence"
        subtitle="Rate how the employee demonstrated key behaviours. Include specific examples in comments."
      />

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

      {isManager && (
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

      <AppraisalTableWrap>
        <table className="appraisal-data-table w-full border-collapse text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-[22%]" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-[34%]" />
            <col className="w-20" />
            {isManager && <col className="w-12" />}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="w-12 px-3 py-3 text-center">No.</th>
              <th className="px-3 py-3 text-left">Key measurement</th>
              <th className="w-24 px-2 py-3 text-center">Weight</th>
              <th className="w-28 px-2 py-3 text-center">Rating</th>
              <th className="px-3 py-3 text-left">
                Comments
                <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
                  Be specific — give one real example
                </span>
              </th>
              <th className="w-20 px-2 py-3 text-center">Score</th>
              {isManager && <th className="w-12 px-2 py-3" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const rowScore = calculateBehaviouralRowScore(
                item.weight,
                item.rating
              );
              return (
                <tr key={item.id ?? index} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-center text-xs font-medium text-slate-400">
                    {index + 1}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.key_measurement}
                      onChange={(e) =>
                        updateItem(index, "key_measurement", e.target.value)
                      }
                      readOnly={!isManager}
                      className={cellInputClass}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={item.weight === 0 ? "" : item.weight}
                        onChange={(e) =>
                          updateItem(index, "weight", e.target.value)
                        }
                        readOnly={!isManager}
                        className={cellNumberClass}
                      />
                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        %
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <select
                      value={item.rating ?? ""}
                      onChange={(e) =>
                        updateItem(index, "rating", e.target.value)
                      }
                      disabled={!isManager}
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
                  <td className="p-2">
                    <textarea
                      value={item.comments}
                      onChange={(e) =>
                        updateItem(index, "comments", e.target.value)
                      }
                      readOnly={!isManager && mode !== "employee"}
                      rows={2}
                      className={cellTextareaClass}
                    />
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-semibold tabular-nums text-slate-800">
                    {rowScore.toFixed(2)}
                  </td>
                  {isManager && (
                    <td className="px-1 py-2 text-center">
                      <RowRemoveButton onClick={() => removeRow(index)} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-semibold">
              <td colSpan={2} className="px-4 py-3 text-right text-slate-600">
                Total weighting
              </td>
              <td
                className={`px-2 py-3 text-center tabular-nums ${
                  weightsOk ? "text-slate-900" : "text-red-600"
                }`}
              >
                {totalWeight.toFixed(2)}%
              </td>
              <td colSpan={isManager ? 3 : 2} />
              <td className="px-2 py-3 text-center tabular-nums text-violet-700">
                {sectionActual.toFixed(2)}
              </td>
              {isManager && <td />}
            </tr>
          </tfoot>
        </table>
      </AppraisalTableWrap>

      <div className="space-y-3 px-6 pt-4 sm:px-8">
        {!weightsOk && isManager && (
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
        helper={`Score = (Weight ÷ 100) × Rating · Section = ${formSectionWeight}% of overall`}
      >
        <SaveButton
          loading={loading}
          label={isTemplate ? "Save template" : "Save behavioural section"}
          onClick={handleSave}
        />
      </AppraisalStickyFooter>
    </AppraisalPanel>
  );
}
