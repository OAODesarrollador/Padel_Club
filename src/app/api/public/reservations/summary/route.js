import { NextResponse } from "next/server";
import { getReservationByCode } from "@/lib/sql/reservations";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code requerido" }, { status: 400 });
  const reservation = await getReservationByCode(code);
  if (!reservation) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true, reservation });
}
