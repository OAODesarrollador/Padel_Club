import { db } from "@/lib/db";

export async function createPayment(payload) {
  const rs = await db.execute({
    sql: `INSERT INTO payments (
            club_id, reservation_id, method, amount, currency, status, mp_preference_id, mp_payment_id, raw_payload
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      payload.club_id,
      payload.reservation_id,
      payload.method,
      payload.amount,
      payload.currency || "ARS",
      payload.status || "PENDING",
      payload.mp_preference_id || null,
      payload.mp_payment_id || null,
      payload.raw_payload ? JSON.stringify(payload.raw_payload) : null
    ]
  });
  return rs.rows?.[0] || null;
}

export async function updatePaymentStatusById(id, status, meta = {}) {
  const rs = await db.execute({
    sql: `UPDATE payments
          SET status = ?, mp_payment_id = COALESCE(?, mp_payment_id), raw_payload = COALESCE(?, raw_payload), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING *`,
    args: [status, meta.mp_payment_id || null, meta.raw_payload ? JSON.stringify(meta.raw_payload) : null, id]
  });
  return rs.rows?.[0] || null;
}

export async function updatePaymentByMpPaymentId(mpPaymentId, status, payload) {
  const rs = await db.execute({
    sql: `UPDATE payments
          SET status = ?, raw_payload = ?, updated_at = CURRENT_TIMESTAMP
          WHERE mp_payment_id = ?
          RETURNING *`,
    args: [status, JSON.stringify(payload), String(mpPaymentId)]
  });
  return rs.rows?.[0] || null;
}

export async function getPaymentByReservationId(reservationId) {
  const rs = await db.execute({
    sql: `SELECT *
          FROM payments
          WHERE reservation_id = ?
          ORDER BY id DESC
          LIMIT 1`,
    args: [reservationId]
  });
  return rs.rows?.[0] || null;
}

export async function getPaymentById(id) {
  const rs = await db.execute({
    sql: "SELECT * FROM payments WHERE id = ?",
    args: [id]
  });
  return rs.rows?.[0] || null;
}
