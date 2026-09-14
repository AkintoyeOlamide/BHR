import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth/profile";
import { listLineManagers } from "@/lib/auth/list-line-managers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * List line managers staff can choose when assigning an appraisal.
 * Excludes full HR admin emails so reviews go to real line managers.
 */
export async function GET() {
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const managers = await listLineManagers({
      excludeUserId: session.profile.id,
    });

    return NextResponse.json(
      { managers },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load managers.",
      },
      { status: 500 }
    );
  }
}
