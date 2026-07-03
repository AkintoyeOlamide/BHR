import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/profile";
import { getHomeRouteForRole } from "@/lib/auth/roles";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const profile = await getProfile(user.id);

  return NextResponse.json({
    role: profile?.role ?? "employee",
    home: getHomeRouteForRole(profile?.role, profile?.email ?? user.email),
    full_name: profile?.full_name ?? user.email,
    email: user.email,
  });
}
