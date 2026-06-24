import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
};

const sizes = {
  sm: { box: "h-8 w-8 text-sm", text: "text-lg" },
  md: { box: "h-10 w-10 text-base", text: "text-xl" },
  lg: { box: "h-12 w-12 text-lg", text: "text-2xl" },
};

export function Logo({ size = "md", theme = "light" }: LogoProps) {
  const s = sizes[size];
  const textColor = theme === "dark" ? "text-white" : "text-slate-900";

  return (
    <Link href="/" className="group flex items-center gap-3">
      <div
        className={`${s.box} flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 font-bold text-white shadow-lg shadow-teal-500/20 transition group-hover:shadow-teal-500/30`}
      >
        B
      </div>
      <span className={`${s.text} font-semibold tracking-tight ${textColor}`}>
        BHR
      </span>
    </Link>
  );
}
