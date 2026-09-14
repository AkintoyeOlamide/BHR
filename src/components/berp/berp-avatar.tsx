const PALETTE = [
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-600",
  "bg-teal-100 text-teal-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function tone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0) * 17) % 997;
  return PALETTE[hash % PALETTE.length];
}

export function BerpAvatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-[11px]" : "h-11 w-11 text-xs";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dim} ${tone(name)}`}
    >
      {initials(name)}
    </span>
  );
}
