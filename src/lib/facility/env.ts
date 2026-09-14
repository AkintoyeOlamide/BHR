export function getFacilityManagerEmail() {
  return (
    process.env.FACILITY_MANAGER_EMAIL?.trim().toLowerCase() ||
    "oyindamola@vmoaeros.com"
  );
}
