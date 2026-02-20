import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/sql/reservations";
import { utcDayRangeFromYmd } from "@/lib/datetime";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clubId = Number(searchParams.get("clubId") || "1");
  const sport = searchParams.get("sport") || "PADEL";
  const day = searchParams.get("day");
  const { start, end } = utcDayRangeFromYmd(day);
  const rows = await getAvailability({ clubId, sport, dayStartUtc: start, dayEndUtc: end });
  return NextResponse.json({ ok: true, rows });
}
