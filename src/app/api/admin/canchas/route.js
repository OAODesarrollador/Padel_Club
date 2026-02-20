import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/security/auth";
import { createCourt, listCourts } from "@/lib/sql/courts";

const schema = z.object({
  club_id: z.number().int().positive(),
  name: z.string().min(2),
  sport: z.enum(["PADEL", "FUTBOL", "TENIS"]),
  image_url: z.string().optional(),
  surface: z.string().optional(),
  location_type: z.string().optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE"]).default("ACTIVE"),
  price_per_hour: z.number().nonnegative(),
  min_duration_min: z.number().int().positive()
});

export async function GET(request) {
  const auth = await requireStaff(request, ["ADMIN", "SECRETARY"]);
  if (auth.error) return auth.error;
  const rows = await listCourts(Number(auth.staff.club_id));
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request) {
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const row = await createCourt(parsed.data);
  return NextResponse.json({ ok: true, row });
}
