import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/security/auth";
import { createEvent, listAdminEvents } from "@/lib/sql/events";

const schema = z.object({
  club_id: z.number().int().positive(),
  title: z.string().min(2),
  description: z.string().optional(),
  sport: z.enum(["PADEL", "FUTBOL", "TENIS"]),
  starts_at: z.string().datetime(),
  spots_left: z.number().int().nonnegative(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  image_url: z.string().optional()
});

export async function GET(request) {
  const auth = await requireStaff(request, ["ADMIN", "SECRETARY"]);
  if (auth.error) return auth.error;
  const rows = await listAdminEvents(Number(auth.staff.club_id));
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request) {
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const row = await createEvent(parsed.data);
  return NextResponse.json({ ok: true, row });
}
