import { NextResponse } from "next/server";
import { getPayment } from "@/lib/mp/client";
import { mapMpStatusToPaymentStatus, verifyWebhookSignature } from "@/lib/mp/webhook";
import { db } from "@/lib/db";
import { createPayment, updatePaymentByMpPaymentId } from "@/lib/sql/payments";

export async function POST(request) {
  const rawBody = await request.text();
  const verified = verifyWebhookSignature(rawBody, request);
  if (!verified) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const paymentId = body?.data?.id || body?.id;
  if (!paymentId) return NextResponse.json({ ok: true });

  const mpPayment = await getPayment(paymentId);
  const paymentStatus = mapMpStatusToPaymentStatus(mpPayment.status);
  const bookingCode = mpPayment.external_reference || mpPayment.metadata?.booking_code;
  if (!bookingCode) return NextResponse.json({ ok: true });

  const reservationRs = await db.execute({
    sql: "SELECT * FROM reservations WHERE booking_code = ? LIMIT 1",
    args: [bookingCode]
  });
  const reservation = reservationRs.rows?.[0];
  if (!reservation) return NextResponse.json({ ok: true });

  const existing = await db.execute({
    sql: "SELECT * FROM payments WHERE mp_payment_id = ? LIMIT 1",
    args: [String(paymentId)]
  });
  if (existing.rows?.[0]) {
    await updatePaymentByMpPaymentId(String(paymentId), paymentStatus, mpPayment);
  } else {
    await createPayment({
      club_id: reservation.club_id,
      reservation_id: reservation.id,
      method: "WALLET_MP",
      amount: mpPayment.transaction_amount || reservation.total_amount,
      status: paymentStatus,
      mp_payment_id: String(paymentId),
      raw_payload: mpPayment
    });
  }

  if (paymentStatus === "PAID") {
    await db.execute({
      sql: `UPDATE reservations
            SET payment_status = 'PAID',
                status = 'CONFIRMED',
                expires_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND status IN ('HOLD','CONFIRMED')`,
      args: [reservation.id]
    });
  }

  if (paymentStatus === "REJECTED") {
    await db.execute({
      sql: `UPDATE reservations
            SET payment_status = 'PAYMENT_REJECTED',
                status = CASE WHEN status = 'HOLD' THEN 'CANCELED' ELSE status END,
                cancel_reason = CASE WHEN status = 'HOLD' THEN 'PAYMENT_REJECTED' ELSE cancel_reason END,
                canceled_at = CASE WHEN status = 'HOLD' THEN CURRENT_TIMESTAMP ELSE canceled_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [reservation.id]
    });
  }

  return NextResponse.json({ ok: true });
}
