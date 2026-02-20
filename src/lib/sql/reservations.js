import { db, tx } from "@/lib/db";
import { addMinutes, mapPaymentUiToMethod } from "@/lib/utils";
import { bookingCode, generateManageToken, sha256 } from "@/lib/security/hash";

export async function cleanupExpiredHolds(clubId) {
  await db.execute({
    sql: `UPDATE reservations
          SET status = 'CANCELED', cancel_reason = 'HOLD_EXPIRED', canceled_at = CURRENT_TIMESTAMP
          WHERE club_id = ?
            AND status = 'HOLD'
            AND expires_at IS NOT NULL
            AND expires_at < CURRENT_TIMESTAMP`,
    args: [clubId]
  });
}

export async function getReservationByCode(code) {
  const rs = await db.execute({
    sql: `SELECT r.*, c.name as court_name, c.sport
          FROM reservations r
          JOIN courts c ON c.id = r.court_id
          WHERE r.booking_code = ?`,
    args: [code]
  });
  return rs.rows?.[0] || null;
}

export async function getReservationById(id) {
  const rs = await db.execute({
    sql: "SELECT * FROM reservations WHERE id = ?",
    args: [id]
  });
  return rs.rows?.[0] || null;
}

export async function getReservationByManageToken(token) {
  const hash = sha256(token);
  const rs = await db.execute({
    sql: `SELECT r.*, c.name as court_name, c.sport
          FROM reservations r
          JOIN courts c ON c.id = r.court_id
          WHERE r.manage_token_hash = ?
          LIMIT 1`,
    args: [hash]
  });
  return rs.rows?.[0] || null;
}

export async function listReservations(clubId, filters = {}) {
  const args = [clubId];
  let sql = `SELECT r.*, c.name as court_name, c.sport
             FROM reservations r
             JOIN courts c ON c.id = r.court_id
             WHERE r.club_id = ?`;
  if (filters.dateFrom) {
    sql += " AND r.start_at >= ?";
    args.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    sql += " AND r.start_at <= ?";
    args.push(filters.dateTo);
  }
  if (filters.status) {
    sql += " AND r.status = ?";
    args.push(filters.status);
  }
  if (filters.sport) {
    sql += " AND c.sport = ?";
    args.push(filters.sport);
  }
  sql += " ORDER BY r.start_at ASC";
  const rs = await db.execute({ sql, args });
  return rs.rows || [];
}

export async function getAvailability({ clubId, sport, dayStartUtc, dayEndUtc }) {
  await cleanupExpiredHolds(clubId);
  const args = [dayEndUtc, dayStartUtc, clubId];
  let sportClause = "";
  if (sport) {
    sportClause = "AND c.sport = ?";
    args.push(sport);
  }
  const rs = await db.execute({
    sql: `SELECT c.id as court_id, c.name as court_name, c.sport, c.price_per_hour, c.min_duration_min,
                 r.id as reservation_id, r.status, r.start_at, r.end_at
          FROM courts c
          LEFT JOIN reservations r
                 ON r.court_id = c.id
                AND r.club_id = c.club_id
                AND r.status IN ('HOLD','CONFIRMED')
                AND r.start_at < ?
                AND r.end_at > ?
          WHERE c.club_id = ? ${sportClause}
          ORDER BY c.id, r.start_at`,
    args
  });
  return rs.rows || [];
}

export async function createHoldReservation(input) {
  return tx(async (trx) => {
    await trx.execute({
      sql: `UPDATE reservations
            SET status = 'CANCELED', cancel_reason = 'HOLD_EXPIRED', canceled_at = CURRENT_TIMESTAMP
            WHERE club_id = ?
              AND status = 'HOLD'
              AND expires_at < CURRENT_TIMESTAMP`,
      args: [input.club_id]
    });

    const overlap = await trx.execute({
      sql: `SELECT id
            FROM reservations
            WHERE club_id = ?
              AND court_id = ?
              AND status IN ('HOLD','CONFIRMED')
              AND (start_at < ?)
              AND (end_at > ?)
            LIMIT 1`,
      args: [input.club_id, input.court_id, input.end_at, input.start_at]
    });

    if (overlap.rows.length > 0) {
      throw new Error("SLOT_TAKEN");
    }

    const manageToken = generateManageToken();
    const manageTokenHash = sha256(manageToken);
    const expiresAt = addMinutes(new Date().toISOString(), 7);

    const rs = await trx.execute({
      sql: `INSERT INTO reservations (
              club_id, court_id, booking_code, status, payment_status, start_at, end_at, duration_min,
              customer_name, customer_phone, customer_email, notes, total_amount, expires_at, manage_token_hash
            ) VALUES (?, ?, ?, 'HOLD', 'UNDEFINED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        input.club_id,
        input.court_id,
        bookingCode(),
        input.start_at,
        input.end_at,
        input.duration_min,
        input.customer_name || "",
        input.customer_phone || "",
        input.customer_email || "",
        input.notes || "",
        input.total_amount,
        expiresAt,
        manageTokenHash
      ]
    });

    return {
      reservation: rs.rows[0],
      manageToken
    };
  });
}

export async function confirmReservation(input) {
  return tx(async (trx) => {
    await trx.execute({
      sql: `UPDATE reservations
            SET status = 'CANCELED', cancel_reason = 'HOLD_EXPIRED', canceled_at = CURRENT_TIMESTAMP
            WHERE club_id = ?
              AND status = 'HOLD'
              AND expires_at < CURRENT_TIMESTAMP`,
      args: [input.club_id]
    });

    const existing = await trx.execute({
      sql: `SELECT *
            FROM reservations
            WHERE booking_code = ?
            LIMIT 1`,
      args: [input.booking_code]
    });
    const row = existing.rows?.[0];
    if (!row) throw new Error("NOT_FOUND");
    if (row.status !== "HOLD" && row.status !== "CONFIRMED") throw new Error("INVALID_STATE");
    if (row.status === "HOLD" && row.expires_at && new Date(row.expires_at) < new Date()) throw new Error("HOLD_EXPIRED");

    const overlap = await trx.execute({
      sql: `SELECT id
            FROM reservations
            WHERE club_id = ?
              AND court_id = ?
              AND status IN ('HOLD','CONFIRMED')
              AND id <> ?
              AND (start_at < ?)
              AND (end_at > ?)
            LIMIT 1`,
      args: [row.club_id, row.court_id, row.id, row.end_at, row.start_at]
    });
    if (overlap.rows.length > 0) {
      throw new Error("SLOT_TAKEN");
    }

    const method = mapPaymentUiToMethod(input.payment_ui_method);
    let paymentStatus = "PAID";
    if (method === "CASH") paymentStatus = "PENDING_CASH";
    if (method === "TRANSFER_EXTERNAL") paymentStatus = "PENDING_TRANSFER_EXTERNAL";
    if (method === "CARD_MP" || method === "WALLET_MP") paymentStatus = "PAYMENT_PENDING";

    const result = await trx.execute({
      sql: `UPDATE reservations
            SET status = 'CONFIRMED',
                payment_method = ?,
                payment_status = ?,
                customer_name = ?,
                customer_phone = ?,
                customer_email = ?,
                notes = ?,
                expires_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *`,
      args: [
        method,
        paymentStatus,
        input.customer_name,
        input.customer_phone,
        input.customer_email,
        input.notes || "",
        row.id
      ]
    });

    return result.rows?.[0];
  });
}

export async function cancelByManageToken({ token, reason = "USER_CANCEL" }) {
  const hash = sha256(token);
  const rs = await db.execute({
    sql: `UPDATE reservations
          SET status = 'CANCELED', cancel_reason = ?, canceled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE manage_token_hash = ?
            AND status IN ('HOLD','CONFIRMED')
          RETURNING *`,
    args: [reason, hash]
  });
  return rs.rows?.[0] || null;
}

export async function rescheduleByManageToken({ token, newStartAt, newEndAt }) {
  return tx(async (trx) => {
    const hash = sha256(token);
    const found = await trx.execute({
      sql: "SELECT * FROM reservations WHERE manage_token_hash = ? LIMIT 1",
      args: [hash]
    });
    const current = found.rows?.[0];
    if (!current) throw new Error("NOT_FOUND");
    if (current.status !== "CONFIRMED") throw new Error("INVALID_STATE");

    const overlap = await trx.execute({
      sql: `SELECT id
            FROM reservations
            WHERE club_id = ?
              AND court_id = ?
              AND status IN ('HOLD','CONFIRMED')
              AND id <> ?
              AND (start_at < ?)
              AND (end_at > ?)
            LIMIT 1`,
      args: [current.club_id, current.court_id, current.id, newEndAt, newStartAt]
    });
    if (overlap.rows.length > 0) throw new Error("SLOT_TAKEN");

    const rotated = generateManageToken();
    const rotatedHash = sha256(rotated);
    const rs = await trx.execute({
      sql: `UPDATE reservations
            SET start_at = ?, end_at = ?, manage_token_hash = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *`,
      args: [newStartAt, newEndAt, rotatedHash, current.id]
    });
    return { reservation: rs.rows[0], manageToken: rotated };
  });
}
