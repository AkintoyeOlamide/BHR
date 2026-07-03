import { NextResponse } from "next/server";
import { getSupabaseEnvStatus } from "@/lib/supabase/env";

export async function GET() {
  const status = getSupabaseEnvStatus();

  return NextResponse.json({
    ...status,
    redeployRequired:
      "After changing env vars in Vercel, open Deployments and click Redeploy.",
  });
}
