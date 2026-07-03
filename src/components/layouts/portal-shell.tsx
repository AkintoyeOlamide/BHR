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

};



export function PortalShell({

  title,

  subtitle,

  role,

  nav,

  children,

}: PortalShellProps) {

  return (

    <div className="portal-light portal-page min-h-screen text-slate-900">

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <Logo size="sm" />

          <div className="flex items-center gap-3">

            <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 sm:inline">

              {roleLabel(role)}

            </span>

            <SignOutButton />

          </div>

        </div>

      </header>



      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        <PortalNav items={nav} />



        <div className="mt-6 sm:mt-8">

          <div className="mb-8">

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">

              {title}

            </h1>

            {subtitle && (

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">

                {subtitle}

              </p>

            )}

          </div>

          {children}

        </div>

      </div>

    </div>

  );

}

