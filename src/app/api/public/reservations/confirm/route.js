import { NextResponse } from "next/server";
import { confirmSchema } from "@/lib/schemas";
import { confirmReservation } from "@/lib/sql/reservations";
import { createPayment } from "@/lib/sql/payments";

export async function POST(request) {
  const payload = await request.json();
  const parsed = confirmSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const reservation = await confirmReservation(parsed.data);
    if (reservation.payment_method === "CASH" || reservation.payment_method === "TRANSFER_EXTERNAL") {
      await createPayment({
        club_id: reservation.club_id,
        reservation_id: reservation.id,
        method: reservation.payment_method,
        amount: reservation.total_amount,
        status: "PENDING"
      });
    }
    return NextResponse.json({ ok: true, reservation });
  } catch (error) {
    const map = {
      SLOT_TAKEN: 409,
      NOT_FOUND: 404,
      HOLD_EXPIRED: 410
    };
    return NextResponse.json({ error: error.message }, { status: map[error.message] || 500 });
  }
}
