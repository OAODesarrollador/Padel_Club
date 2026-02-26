import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/security/auth";
import { getClubSettings, updateClubSettings } from "@/lib/sql/settings";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  timezone: z.string().min(2),
  transfer_alias: z.string().optional(),
  transfer_cbu: z.string().optional(),
  transfer_holder: z.string().optional(),
  transfer_bank: z.string().optional(),
  hold_minutes: z.number().int().min(1).max(60),
  cancel_hours_before: z.number().int().min(0).max(168),
  reschedule_limit: z.number().int().min(0).max(10)
});

export async function GET(request) {
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  const settings = await getClubSettings(Number(auth.staff.club_id));
  if (!settings) return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request) {
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const settings = await updateClubSettings(Number(auth.staff.club_id), parsed.data);
  return NextResponse.json({ ok: true, settings });
}
