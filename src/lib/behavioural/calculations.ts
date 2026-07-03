export type BehaviouralRow = {
  id?: string;
  sort_order: number;
  key_measurement: string;
  weight: number;
  rating: number | null;
  comments: string;
};

export const BEHAVIOURAL_SECTION_WEIGHT_DEFAULT = 20;
export const BEHAVIOURAL_MAX_ROWS = 50;
export const BEHAVIOURAL_RATING_MIN = 1;
export const BEHAVIOURAL_RATING_MAX = 5;

export function calculateBehaviouralRowScore(
  weight: number,
  rating: number | null
): number {
  if (
    rating === null ||
    rating < BEHAVIOURAL_RATING_MIN ||
    rating > BEHAVIOURAL_RATING_MAX
  ) {
    return 0;
  }
  return (weight / 100) * rating;
}

export function calculateBehaviouralOverallRating(
  items: Pick<BehaviouralRow, "weight" | "rating">[]
): number {
  return items.reduce(
    (sum, item) => sum + calculateBehaviouralRowScore(item.weight, item.rating),
    0
  );
}

export function calculateBehaviouralSectionActual(
  overallRating: number,
  sectionWeight = BEHAVIOURAL_SECTION_WEIGHT_DEFAULT
): number {
  return overallRating * (sectionWeight / 100);
}

export function calculateBehaviouralTotalWeight(
  items: Pick<BehaviouralRow, "weight">[]
): number {
  return items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
}

export function isBehaviouralWeightOverLimit(
  items: Pick<BehaviouralRow, "weight">[]
): boolean {
  return calculateBehaviouralTotalWeight(items) > 100.01;
}

export function distributeBehaviouralWeightsEvenly(count: number): number[] {
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

export function createEmptyBehaviouralRow(
  sortOrder: number,
  weight = 0
): BehaviouralRow {
  return {
    sort_order: sortOrder,
    key_measurement: "",
    weight,
    rating: null,
    comments: "",
  };
}

export function createDefaultBehaviouralRows(count = 1): BehaviouralRow[] {
  return Array.from({ length: count }, (_, index) =>
    createEmptyBehaviouralRow(index + 1, 0)
  );
}
