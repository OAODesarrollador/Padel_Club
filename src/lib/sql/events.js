import { db } from "@/lib/db";

export async function listPublicEvents(clubId) {
  const rs = await db.execute({
    sql: `SELECT id, title, sport, starts_at, spots_left, status, image_url
          FROM events
          WHERE club_id = ? AND status = 'PUBLISHED'
          ORDER BY starts_at ASC`,
    args: [clubId]
  });
  return rs.rows || [];
}

export async function listAdminEvents(clubId) {
  const rs = await db.execute({
    sql: `SELECT *
          FROM events
          WHERE club_id = ?
          ORDER BY starts_at DESC`,
    args: [clubId]
  });
  return rs.rows || [];
}

export async function createEvent(payload) {
  const rs = await db.execute({
    sql: `INSERT INTO events (
            club_id, title, description, sport, starts_at, spots_left, status, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      payload.club_id,
      payload.title,
      payload.description || "",
      payload.sport,
      payload.starts_at,
      payload.spots_left || 0,
      payload.status || "DRAFT",
      payload.image_url || ""
    ]
  });
  return rs.rows?.[0] || null;
}

export async function updateEvent(id, payload) {
  const rs = await db.execute({
    sql: `UPDATE events
          SET title = ?, description = ?, sport = ?, starts_at = ?, spots_left = ?, status = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING *`,
    args: [
      payload.title,
      payload.description || "",
      payload.sport,
      payload.starts_at,
      payload.spots_left || 0,
      payload.status || "DRAFT",
      payload.image_url || "",
      id
    ]
  });
  return rs.rows?.[0] || null;
}

export async function deleteEvent(id) {
  await db.execute({
    sql: "DELETE FROM events WHERE id = ?",
    args: [id]
  });
}
