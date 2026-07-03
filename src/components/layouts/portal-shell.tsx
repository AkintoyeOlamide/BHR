import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { roleLabel } from "@/lib/auth/roles";
import { PortalNav } from "./portal-nav";
import type { NavItem } from "@/lib/navigation/portal-nav";

type PortalShellProps = {
  title: string;
  subtitle?: string;
  role: string;
  nav: NavItem[];
  children: React.ReactNode;
  compact?: boolean;
  backHref?: string;
  backLabel?: string;
  statusLabel?: string;
  statusClassName?: string;
};

export function PortalShell({
  title,
  subtitle,
  role,
  nav,
  children,
  compact = false,
  backHref,
  backLabel = "Back",
  statusLabel,
  statusClassName,
}: PortalShellProps) {
  const focus = Boolean(backHref);

  return (
    <div className="portal-light portal-page portal-shell-mobile-flat min-h-screen text-slate-900">
      <header className="portal-header sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile — focused appraisal header */}
          {focus && (
            <div className="sm:hidden">
              <div className="flex h-11 items-center justify-between">
                <Link
                  href={backHref!}
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M10 3L5 8l5 5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {backLabel}
                </Link>
                <SignOutButton />
              </div>
              <div className="border-t border-slate-200/70 pb-3 pt-2.5">
                <h1 className="text-lg font-semibold leading-snug tracking-tight text-slate-900">
                  {title}
                </h1>
                {(subtitle || statusLabel) && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {subtitle && (
                      <span className="text-xs text-slate-500">{subtitle}</span>
                    )}
                    {statusLabel && (
                      <span className={statusClassName}>{statusLabel}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desktop — standard header */}
          <div className={`${focus ? "hidden sm:block" : ""}`}>
            <div className="flex h-12 items-center justify-between sm:h-16">
              <Logo size="sm" theme="light" />
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="portal-role-badge hidden sm:inline">
                  {roleLabel(role)}
                </span>
                <SignOutButton />
              </div>
            </div>
            <PortalNav items={nav} />
          </div>
        </div>
      </header>

      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          compact ? "pb-8 pt-3 sm:pb-12 sm:pt-6" : "pb-12 pt-6 sm:pt-10"
        }`}
      >
        {/* Title block — desktop, or all pages without focus back link */}
        <div
          className={`${
            focus ? "mb-3 hidden sm:block sm:mb-6" : compact ? "mb-4 sm:mb-8" : "mb-8 sm:mb-10"
          }`}
        >
          {focus && (
            <Link
              href={backHref!}
              className="portal-link mb-3 hidden text-sm sm:inline-flex sm:items-center sm:gap-1"
            >
              ← Back to {backLabel.toLowerCase()}
            </Link>
          )}
          <h1
            className={`font-semibold tracking-tight text-slate-900 ${
              compact
                ? "text-lg leading-snug sm:text-2xl md:text-3xl"
                : "text-2xl md:text-3xl"
            }`}
          >
            {title}
          </h1>
          {(subtitle || statusLabel) && (
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-2">
              {subtitle && (
                <p
                  className={`max-w-2xl text-slate-500 ${
                    compact ? "text-xs sm:text-sm md:text-base" : "text-sm md:text-base"
                  }`}
                >
                  {subtitle}
                </p>
              )}
              {statusLabel && (
                <span className={statusClassName}>{statusLabel}</span>
              )}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
