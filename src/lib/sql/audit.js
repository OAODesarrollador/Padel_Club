import { db } from "@/lib/db";

export async function writeAuditLog(payload) {
  await db.execute({
    sql: `INSERT INTO audit_logs (club_id, staff_user_id, action, resource, resource_id, payload_json)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      payload.club_id || null,
      payload.staff_user_id || null,
      payload.action,
      payload.resource,
      payload.resource_id || null,
      payload.payload_json ? JSON.stringify(payload.payload_json) : null
    ]
  });
}

export async function writeMessageLog(payload) {
  await db.execute({
    sql: `INSERT INTO message_logs (club_id, reservation_id, channel, recipient, body, metadata_json)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      payload.club_id,
      payload.reservation_id || null,
      payload.channel || "WHATSAPP",
      payload.recipient || "",
      payload.body || "",
      payload.metadata_json ? JSON.stringify(payload.metadata_json) : null
    ]
  });
}
