import { NextResponse } from "next/server";
import { listPublicEvents } from "@/lib/sql/events";
import { getPublicClubId } from "@/lib/config/club";

export async function GET(request) {
  const clubId = getPublicClubId();
  const events = await listPublicEvents(clubId);
  return NextResponse.json({ ok: true, events });
}
