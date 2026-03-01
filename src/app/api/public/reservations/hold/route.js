import { NextResponse } from "next/server";
import { holdSchema } from "@/lib/schemas";
import { createHoldReservation } from "@/lib/sql/reservations";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/auth";
import { getPublicClubId } from "@/lib/config/club";

export async function POST(request) {
  const payload = await request.json();
  const parsed = holdSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ip = getClientIp(request);
  const guardByIp = await checkRateLimit({ scope: "public-hold-ip", id: ip, limit: 20, windowMs: 60_000 });
  if (!guardByIp.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  const byPhone = await checkRateLimit({
    scope: "public-hold-phone",
    id: parsed.data.customer_phone || "unknown",
    limit: 10,
    windowMs: 60_000
  });
  if (!byPhone.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  try {
    const result = await createHoldReservation({
      ...parsed.data,
      club_id: getPublicClubId()
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "Horario no disponible" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear el hold" }, { status: 500 });
  }
}
