import { NextResponse } from "next/server";
import { listPublicEvents } from "@/lib/sql/events";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clubId = Number(searchParams.get("clubId") || "1");
  const events = await listPublicEvents(clubId);
  return NextResponse.json({ ok: true, events });
}
