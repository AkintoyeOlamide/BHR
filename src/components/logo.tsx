import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
};

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function Logo({ size = "md", theme = "light" }: LogoProps) {
  const textColor = theme === "dark" ? "text-white" : "text-slate-900";

  return (
    <Link
      href="/"
      className={`${sizes[size]} font-semibold tracking-tight ${textColor}`}
    >
      Bitachon HR
    </Link>
  );
}
