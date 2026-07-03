function normalizeEnvValue(value: string | undefined) {
  if (!value) return null;

  let trimmed = value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  if (!trimmed) return null;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed || null;
}

function normalizeSupabaseUrl(value: string | undefined) {
  let raw = normalizeEnvValue(value);
  if (!raw) return null;

  if (raw.includes("=") && raw.toLowerCase().includes("supabase")) {
    const [, ...rest] = raw.split("=");
    raw = rest.join("=").trim();
  }

  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    raw = `https://${raw.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes("supabase.co")) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export type SupabaseEnvStatus = {
  configured: boolean;
  url: { set: boolean; valid: boolean };
  anonKey: { set: boolean };
  secretKey: { set: boolean };
  urlDebug?: {
    length: number;
    startsWithHttp: boolean;
    containsSupabaseCo: boolean;
    hostname: string | null;
  };
  hint?: string;
};

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const rawUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  const secretKey = normalizeEnvValue(process.env.SUPABASE_SECRET_KEY);

  const status: SupabaseEnvStatus = {
    configured: Boolean(url && anonKey),
    url: { set: Boolean(rawUrl), valid: Boolean(url) },
    anonKey: { set: Boolean(anonKey) },
    secretKey: { set: Boolean(secretKey) },
  };

  if (rawUrl) {
    let hostname: string | null = null;
    try {
      hostname = new URL(
        rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
      ).hostname;
    } catch {
      hostname = null;
    }

    status.urlDebug = {
      length: rawUrl.length,
      startsWithHttp: /^https?:\/\//i.test(rawUrl),
      containsSupabaseCo: rawUrl.includes("supabase.co"),
      hostname,
    };
  }

  if (!rawUrl) {
    status.hint =
      "Set NEXT_PUBLIC_SUPABASE_URL in Vercel to https://vfrgawklszvhddrvjjxj.supabase.co";
  } else if (!url) {
    status.hint =
      "NEXT_PUBLIC_SUPABASE_URL is set but invalid. Use https://vfrgawklszvhddrvjjxj.supabase.co with no quotes or spaces.";
  } else if (!anonKey) {
    status.hint = "Set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.";
  } else if (!secretKey) {
    status.hint =
      "Set SUPABASE_SECRET_KEY in Vercel for seeding and assignment emails.";
  }

  return status;
}

export function getSupabaseEnv() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
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
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const secretKey = normalizeEnvValue(process.env.SUPABASE_SECRET_KEY);

  if (!url || !secretKey) {
    return null;
  }

  return { url, secretKey };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}

export function getSupabaseConfigError() {
  const status = getSupabaseEnvStatus();
  return status.hint ?? null;
}
