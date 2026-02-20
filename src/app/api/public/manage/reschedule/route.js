import { NextResponse } from "next/server";
import { z } from "zod";
import { getReservationByManageToken, rescheduleByManageToken } from "@/lib/sql/reservations";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/auth";

const schema = z.object({
  token: z.string().min(10),
  new_start_at: z.string().datetime(),
  new_end_at: z.string().datetime()
});

export async function POST(request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ip = getClientIp(request);
  const guard = checkRateLimit({ scope: "manage-reschedule-ip", id: ip, limit: 6, windowMs: 60_000 });
  if (!guard.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  const reservation = await getReservationByManageToken(parsed.data.token);
  const phoneId = reservation?.customer_phone || "unknown";
  const byPhone = checkRateLimit({ scope: "manage-reschedule-phone", id: phoneId, limit: 4, windowMs: 60_000 });
  if (!byPhone.ok) return NextResponse.json({ error: "Límite de intentos por teléfono" }, { status: 429 });

  try {
    const result = await rescheduleByManageToken({
      token: parsed.data.token,
      newStartAt: parsed.data.new_start_at,
      newEndAt: parsed.data.new_end_at
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
