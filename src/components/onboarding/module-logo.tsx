import type { OnboardingModule } from "@/lib/onboarding/types";

type ModuleLogoProps = {
  module: Pick<OnboardingModule, "name" | "shortName" | "logoUrl">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: "h-6 w-auto max-w-[6rem]",
  md: "h-8 w-auto max-w-[9.5rem]",
  lg: "h-9 w-auto max-w-[11.5rem] sm:h-10",
} as const;

export function ModuleLogo({
  module,
  size = "md",
  className = "",
}: ModuleLogoProps) {
  if (!module.logoUrl) {
    return (
      <span
        className={`inline-flex h-8 items-center rounded-lg bg-slate-900 px-2.5 text-xs font-bold tracking-wide text-white ${className}`}
      >
        {module.shortName}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={module.logoUrl}
      alt={module.name}
      className={`${SIZE[size]} object-contain object-left ${className}`}
    />
  );
}
