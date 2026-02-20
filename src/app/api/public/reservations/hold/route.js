import { NextResponse } from "next/server";
import { holdSchema } from "@/lib/schemas";
import { createHoldReservation } from "@/lib/sql/reservations";

export async function POST(request) {
  const payload = await request.json();
  const parsed = holdSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await createHoldReservation(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "Horario no disponible" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear el hold" }, { status: 500 });
  }
}
