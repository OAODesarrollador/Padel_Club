import { db } from "@/lib/db";

export async function getClubSettings(clubId) {
  const rs = await db.execute({
    sql: `SELECT
            id, name, slug, phone, email, address, timezone,
            transfer_alias, transfer_cbu, transfer_holder, transfer_bank,
            hold_minutes, cancel_hours_before, reschedule_limit
          FROM clubs
          WHERE id = ?
          LIMIT 1`,
    args: [clubId]
  });
  return rs.rows?.[0] || null;
}

export async function updateClubSettings(clubId, payload) {
  const rs = await db.execute({
    sql: `UPDATE clubs
          SET name = ?,
              phone = ?,
              email = ?,
              address = ?,
              timezone = ?,
              transfer_alias = ?,
              transfer_cbu = ?,
              transfer_holder = ?,
              transfer_bank = ?,
              hold_minutes = ?,
              cancel_hours_before = ?,
              reschedule_limit = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING
            id, name, slug, phone, email, address, timezone,
            transfer_alias, transfer_cbu, transfer_holder, transfer_bank,
            hold_minutes, cancel_hours_before, reschedule_limit`,
    args: [
      payload.name,
      payload.phone || "",
      payload.email || "",
      payload.address || "",
      payload.timezone || "UTC",
      payload.transfer_alias || "",
      payload.transfer_cbu || "",
      payload.transfer_holder || "",
      payload.transfer_bank || "",
      payload.hold_minutes,
      payload.cancel_hours_before,
      payload.reschedule_limit,
      clubId
    ]
  });
  return rs.rows?.[0] || null;
}
