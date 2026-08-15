import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip auth middleware for static assets and onboarding media so
     * videos/pages are not blocked by Supabase session checks.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|media/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|pdf|mov)$).*)",
  ],
};
