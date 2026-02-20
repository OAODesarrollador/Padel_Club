import { NextResponse } from "next/server";
import { z } from "zod";
import { createPreference } from "@/lib/mp/client";
import { createPayment } from "@/lib/sql/payments";
import { getReservationByCode } from "@/lib/sql/reservations";

const schema = z.object({
  booking_code: z.string().min(3),
  ui_method: z.enum(["mp"])
});

export async function POST(request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reservation = await getReservationByCode(parsed.data.booking_code);
  if (!reservation) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

  const site = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const preference = await createPreference({
    items: [
      {
        title: `Reserva ${reservation.booking_code} - ${reservation.court_name}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: Number(reservation.total_amount)
      }
    ],
    external_reference: reservation.booking_code,
    notification_url: `${site}/api/payments/mp/webhook`,
      metadata: {
        booking_code: reservation.booking_code,
        reservation_id: reservation.id,
        ui_method: parsed.data.ui_method
      }
  });

  await createPayment({
    club_id: reservation.club_id,
    reservation_id: reservation.id,
    method: "WALLET_MP",
    amount: reservation.total_amount,
    status: "PENDING",
    mp_preference_id: preference.id,
    raw_payload: preference
  });

  return NextResponse.json({
    ok: true,
    preference_id: preference.id,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    public_key: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
  });
}
