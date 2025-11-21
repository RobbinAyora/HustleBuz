import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  console.log("🪵 CLIENT LOG:", body.message);
  return NextResponse.json({ ok: true });
}
