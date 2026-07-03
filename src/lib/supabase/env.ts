function normalizeEnvValue(value: string | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || null;
  }

  return trimmed;
}

export function getSupabaseEnv() {
  const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secretKey = normalizeEnvValue(process.env.SUPABASE_SECRET_KEY);

  if (!url || !secretKey) {
    return null;
  }

  return { url, secretKey };
}
export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}
