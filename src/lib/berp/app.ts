export const BERP_APP_ID = "berp" as const;

/** Filter any Supabase query to BERP rows. Same value the phone writes. */
export function forBerpApp<
  T extends { eq: (column: string, value: string) => T },
>(query: T) {
  return query.eq("app_id", BERP_APP_ID);
}
