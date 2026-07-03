import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  variant?: "light" | "dark" | "landing" | "form";
  hint?: string;
};

const variants = {
  light:
    "rounded-xl bg-slate-100 px-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100",
  dark:
    "rounded-xl bg-slate-100 px-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100",
  landing:
    "rounded-lg bg-white px-3 text-slate-900 shadow-sm placeholder:text-slate-400 transition focus:ring-2 focus:ring-blue-100",
  form:
    "rounded-lg bg-white px-3 text-slate-900 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 transition focus:ring-2 focus:ring-violet-200 read-only:bg-slate-50 read-only:text-slate-600 read-only:shadow-none",
};

export function Input({
  label,
  id,
  variant = "light",
  hint,
  className = "",
  readOnly,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const isForm = variant === "form";

  return (
    <label
      htmlFor={inputId}
      className={`block ${variant === "landing" ? "space-y-1" : "space-y-1.5"}`}
    >
      <span
        className={`block font-medium ${
          isForm
            ? "text-xs text-slate-600"
            : variant === "landing"
              ? "text-xs text-slate-600"
              : "text-sm text-slate-700"
        }`}
      >
        {label}
        {readOnly && isForm && (
          <span className="ml-1.5 font-normal text-slate-400">(read only)</span>
        )}
      </span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      <input
        id={inputId}
        readOnly={readOnly}
        className={`w-full outline-none ${
          variant === "landing"
            ? `h-9 text-xs ${variants.landing}`
            : isForm
              ? `h-10 text-sm ${variants.form}`
              : `h-10 text-sm sm:h-11 ${variants[variant === "dark" ? "dark" : "light"]}`
        } ${className}`}
        {...props}
      />
    </label>
  );
}
