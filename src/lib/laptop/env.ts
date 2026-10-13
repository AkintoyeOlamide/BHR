const DEFAULT_LAPTOP_REQUEST_INBOX = "olamide@vmoaeros.com";

export function getLaptopRequestInbox() {
  const override = process.env.LAPTOP_REQUEST_EMAIL?.trim().toLowerCase();
  if (override) return override;
  return DEFAULT_LAPTOP_REQUEST_INBOX;
}
