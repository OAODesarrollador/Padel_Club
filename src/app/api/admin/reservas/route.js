import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/security/auth";
import { createHoldReservation, listReservations } from "@/lib/sql/reservations";
import { writeAuditLog } from "@/lib/sql/audit";

const createSchema = z.object({
  club_id: z.number().int().positive(),
  court_id: z.number().int().positive(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  duration_min: z.number().int().positive(),
  total_amount: z.number().nonnegative(),
  customer_name: z.string().min(2),
  customer_phone: z.string().min(6),
  customer_email: z.string().email().optional().or(z.literal(""))
});

export async function GET(request) {
  const auth = await requireStaff(request);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const rows = await listReservations(Number(auth.staff.club_id), {
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    status: searchParams.get("status") || undefined,
    sport: searchParams.get("sport") || undefined
  });
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request) {
  const auth = await requireStaff(request);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const created = await createHoldReservation(parsed.data);
    await writeAuditLog({
      club_id: parsed.data.club_id,
      staff_user_id: Number(auth.staff.sub),
      action: "ADMIN_CREATE_HOLD",
      resource: "reservation",
      resource_id: created.reservation.id,
      payload_json: created.reservation
    });
    return NextResponse.json({ ok: true, ...created });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
