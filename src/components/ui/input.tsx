import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  variant?: "light" | "dark";
};

const variants = {
  light:
    "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:ring-violet-100",
  dark: "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-fuchsia-400/50 focus:ring-fuchsia-400/20 backdrop-blur-sm",
};

export function Input({
  label,
  id,
  variant = "light",
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="block space-y-2">
      <span
        className={`text-sm font-medium ${variant === "dark" ? "text-white/70" : "text-slate-700"}`}
      >
        {label}
      </span>
      <input
        id={inputId}
        className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2 ${variants[variant]} ${className}`}
        {...props}
      />
    </label>
  );
}
