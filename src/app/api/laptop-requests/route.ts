import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This form is closed." },
    { status: 410 }
  );
}
