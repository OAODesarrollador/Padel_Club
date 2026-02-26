import { db } from "@/lib/db";

let ruleColumnsChecked = false;

async function ensureRuleColumns() {
  if (ruleColumnsChecked) return;
  const alterations = [
    "ALTER TABLE clubs ADD COLUMN hold_minutes INTEGER NOT NULL DEFAULT 7",
    "ALTER TABLE clubs ADD COLUMN cancel_hours_before INTEGER NOT NULL DEFAULT 2",
    "ALTER TABLE clubs ADD COLUMN reschedule_limit INTEGER NOT NULL DEFAULT 1"
  ];
  for (const sql of alterations) {
    try {
      await db.execute({ sql, args: [] });
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      if (!message.includes("duplicate column")) throw error;
    }
  }
  ruleColumnsChecked = true;
}

export async function getClubSettings(clubId) {
  await ensureRuleColumns();
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
  await ensureRuleColumns();
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
