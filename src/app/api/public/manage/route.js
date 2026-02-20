import { NextResponse } from "next/server";
import { getReservationByManageToken } from "@/lib/sql/reservations";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token requerido" }, { status: 400 });

  const ip = getClientIp(request);
  const guard = checkRateLimit({ scope: "manage-get-ip", id: ip, limit: 40, windowMs: 60_000 });
  if (!guard.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const reservation = await getReservationByManageToken(token);
  if (!reservation) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, reservation });
}
