"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation/portal-nav";

const NAV_COLORS = ["#4f46e5", "#2563eb", "#7c3aed", "#0d9488"] as const;

export function PortalNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin" || href === "/manager") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="portal-nav-scroll flex gap-1.5 overflow-x-auto pb-3 pt-1 sm:flex-wrap sm:gap-2 sm:overflow-visible"
      aria-label="Main navigation"
    >
      {items.map((item, index) => {
        const active = isActive(item.href);
        const color = NAV_COLORS[index % NAV_COLORS.length];

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-3.5 sm:py-2 sm:text-sm ${
              active ? "text-white" : "text-slate-500 hover:text-slate-800"
            }`}
            style={
              active
                ? { backgroundColor: color }
                : { backgroundColor: "transparent" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
