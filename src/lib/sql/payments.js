import { db } from "@/lib/db";

export async function createPayment(payload) {
  const rs = await db.execute({
    sql: `INSERT INTO payments (
            club_id, reservation_id, method, amount_cents, currency, status, mp_preference_id, mp_payment_id, raw_payload
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      payload.club_id,
      payload.reservation_id,
      payload.method,
      payload.amount_cents,
      payload.currency || "ARS",
      payload.status || "PENDING",
      payload.mp_preference_id || null,
      payload.mp_payment_id || null,
      payload.raw_payload ? JSON.stringify(payload.raw_payload) : null
    ]
  });
  return rs.rows?.[0] || null;
}

export async function updatePaymentStatusById({ id, clubId, status, meta = {} }) {
  const rs = await db.execute({
    sql: `UPDATE payments
          SET status = ?, mp_payment_id = COALESCE(?, mp_payment_id), raw_payload = COALESCE(?, raw_payload), updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND club_id = ?
          RETURNING *`,
    args: [status, meta.mp_payment_id || null, meta.raw_payload ? JSON.stringify(meta.raw_payload) : null, id, clubId]
  });
  return rs.rows?.[0] || null;
}

export async function upsertPaymentByMpPaymentId(payload) {
  const rs = await db.execute({
    sql: `INSERT INTO payments (
            club_id, reservation_id, method, amount_cents, currency, status, mp_preference_id, mp_payment_id, raw_payload
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(mp_payment_id) DO UPDATE SET
            status = excluded.status,
            amount_cents = excluded.amount_cents,
            raw_payload = excluded.raw_payload,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *`,
    args: [
      payload.club_id,
      payload.reservation_id,
      payload.method,
      payload.amount_cents,
      payload.currency || "ARS",
      payload.status || "PENDING",
      payload.mp_preference_id || null,
      String(payload.mp_payment_id),
      payload.raw_payload ? JSON.stringify(payload.raw_payload) : null
    ]
  });
  return rs.rows?.[0] || null;
}

export async function getPaymentByReservationId({ reservationId, clubId }) {
  const rs = await db.execute({
    sql: `SELECT *
          FROM payments
          WHERE reservation_id = ? AND club_id = ?
          ORDER BY id DESC
          LIMIT 1`,
    args: [reservationId, clubId]
  });
  return rs.rows?.[0] || null;
}

export async function getPaymentById({ id, clubId }) {
  const rs = await db.execute({
    sql: "SELECT * FROM payments WHERE id = ? AND club_id = ?",
    args: [id, clubId]
  });
  return rs.rows?.[0] || null;
}
