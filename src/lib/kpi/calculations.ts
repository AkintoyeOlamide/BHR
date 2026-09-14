export type KpiRow = {
  id?: string;
  sort_order: number;
  task: string;
  weight: number;
  rating: number | null;
  manager_rating: number | null;
  measurement_area: string;
};

export const KPI_SECTION_WEIGHT_DEFAULT = 80;
export const KPI_MAX_ROWS = 50;
export const KPI_RATING_MIN = 1;
export const KPI_RATING_MAX = 5;

/** Official rating: manager overrides staff when present. */
export function getKpiEffectiveRating(
  row: Pick<KpiRow, "rating" | "manager_rating">
): number | null {
  return row.manager_rating ?? row.rating;
}

export function calculateKpiRowScore(weight: number, rating: number | null): number {
  if (rating === null || rating < KPI_RATING_MIN || rating > KPI_RATING_MAX) {
    return 0;
  }
  return (weight / 100) * rating;
}

export function calculateKpiOverallRating(
  kpis: Pick<KpiRow, "weight" | "rating" | "manager_rating">[]
): number {
  return kpis.reduce(
    (sum, kpi) =>
      sum + calculateKpiRowScore(kpi.weight, getKpiEffectiveRating(kpi)),
    0
  );
}

export function calculateKpiSectionActual(
  overallRating: number,
  sectionWeight = KPI_SECTION_WEIGHT_DEFAULT
): number {
  return overallRating * (sectionWeight / 100);
}

export function calculateTotalWeight(kpis: Pick<KpiRow, "weight">[]): number {
  return kpis.reduce((sum, kpi) => sum + (Number(kpi.weight) || 0), 0);
}

export function isWeightOverLimit(kpis: Pick<KpiRow, "weight">[]): boolean {
  return calculateTotalWeight(kpis) > 100.01;
}

/** @deprecated Use isWeightOverLimit — weights must not exceed 100% */
export function isWeightValid(kpis: Pick<KpiRow, "weight">[]): boolean {
  return !isWeightOverLimit(kpis);
}

export function distributeWeightsEvenly(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(10000 / count) / 100;
  const weights = Array(count).fill(base);
  const remainder = Math.round((100 - base * count) * 100) / 100;
  if (remainder !== 0 && weights.length > 0) {
    weights[weights.length - 1] =
      Math.round((weights[weights.length - 1] + remainder) * 100) / 100;
  }
  return weights;
}

export function createEmptyKpiRow(sortOrder: number, weight = 0): KpiRow {
  return {
    sort_order: sortOrder,
    task: "",
    weight,
    rating: null,
    manager_rating: null,
    measurement_area: "",
  };
}

export function createDefaultKpiRows(count = 1): KpiRow[] {
  return Array.from({ length: count }, (_, index) =>
    createEmptyKpiRow(index + 1, 0)
  );
}

export function parseRatingValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

export function isValidOptionalRating(rating: number | null): boolean {
  if (rating === null) return true;
  return (
    !Number.isNaN(rating) &&
    rating >= KPI_RATING_MIN &&
    rating <= KPI_RATING_MAX
  );
}
