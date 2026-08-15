import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import {
  canAccessAdmin,
  canAccessFacility,
  canAccessManager,
  getHomeRouteForRole,
} from "@/lib/auth/roles";

async function getProfileAccess(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  userEmail?: string | null
) {
  const { data } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle();

  const role = data?.role ?? null;
  const email = data?.email || userEmail || "";

  return { role, email };
}

export async function updateSession(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Public onboarding LMS — skip Supabase entirely for fast navigation.
    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
      return NextResponse.next({ request });
    }

    const env = getSupabaseEnv();

    if (!env) {
      return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute =
      pathname.startsWith("/login") || pathname.startsWith("/auth");
    const isProtectedRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/manager") ||
      pathname === "/facility" ||
      pathname.startsWith("/facility/");

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const { role, email } = await getProfileAccess(
        supabase,
        user.id,
        user.email
      );
      const url = request.nextUrl.clone();
      url.pathname = getHomeRouteForRole(role, email);
      return NextResponse.redirect(url);
    }

    if (user) {
      const { role, email } = await getProfileAccess(
        supabase,
        user.id,
        user.email
      );

      if (pathname.startsWith("/admin") && !canAccessAdmin(role, email)) {
        const url = request.nextUrl.clone();
        url.pathname = getHomeRouteForRole(role, email);
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/manager") && !canAccessManager(role)) {
        // Allow full HR emails even if profiles.role is incomplete.
        if (!canAccessAdmin(role, email)) {
          const url = request.nextUrl.clone();
          url.pathname = getHomeRouteForRole(role, email);
          return NextResponse.redirect(url);
        }
      }

      if (
        (pathname === "/facility" || pathname.startsWith("/facility/")) &&
        !canAccessFacility(role, email)
      ) {
        const url = request.nextUrl.clone();
        url.pathname = getHomeRouteForRole(role, email);
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next({ request });
  }
}
