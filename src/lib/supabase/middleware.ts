import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import {
  canAccessAdmin,
  canAccessBerp,
  canAccessFacility,
  canAccessManager,
  getHomeRouteForRole,
  resolveEffectiveRole,
} from "@/lib/auth/roles";

async function getProfileAccess(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  userEmail?: string | null,
  userMetaRole?: string | null
) {
  const authEmail = (userEmail ?? "").trim().toLowerCase();

  const [{ data: profile }, { data: legacy }] = await Promise.all([
    supabase.from("profiles").select("role, email").eq("id", userId).maybeSingle(),
    supabase
      .from("legacy_employee_profiles")
      .select("role, email")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const role = resolveEffectiveRole(
    profile?.role,
    legacy?.role,
    userMetaRole
  );

  // Prefer the signed-in auth email for access checks (profile email can be stale).
  const email =
    authEmail ||
    (profile?.email ?? "").trim().toLowerCase() ||
    (legacy?.email ?? "").trim().toLowerCase();

  return { role, email };
}

function safeNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function updateSession(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Public pages — skip Supabase entirely for fast navigation.
    if (
      pathname === "/onboarding" ||
      pathname.startsWith("/onboarding/") ||
      pathname === "/reporting" ||
      pathname === "/link" ||
      pathname === "/laptoprequest" ||
      pathname.startsWith("/facility-report") ||
      pathname.startsWith("/facility-fix/")
    ) {
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
    const isBerpRoute = pathname === "/berp" || pathname.startsWith("/berp/");
    const isProtectedRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/manager") ||
      isBerpRoute ||
      pathname === "/facility" ||
      pathname.startsWith("/facility/");

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const { role, email } = await getProfileAccess(
        supabase,
        user.id,
        user.email,
        typeof user.user_metadata?.role === "string"
          ? user.user_metadata.role
          : null
      );
      const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
      const url = request.nextUrl.clone();
      url.search = "";
      url.pathname =
        nextPath &&
        (nextPath === "/berp" || nextPath.startsWith("/berp/")
          ? canAccessBerp(role, email)
          : true)
          ? nextPath
          : getHomeRouteForRole(role, email);
      return NextResponse.redirect(url);
    }

    if (user) {
      const { role, email } = await getProfileAccess(
        supabase,
        user.id,
        user.email,
        typeof user.user_metadata?.role === "string"
          ? user.user_metadata.role
          : null
      );

      if (pathname.startsWith("/admin") && !canAccessAdmin(role, email)) {
        const url = request.nextUrl.clone();
        url.pathname = getHomeRouteForRole(role, email);
        return NextResponse.redirect(url);
      }

      if (isBerpRoute && !canAccessBerp(role, email)) {
        const url = request.nextUrl.clone();
        url.pathname = getHomeRouteForRole(role, email);
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith("/manager") && !canAccessManager(role)) {
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
