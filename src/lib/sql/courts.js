import { db } from "@/lib/db";

let imageColumnChecked = false;

async function ensureCourtImageColumn() {
  if (imageColumnChecked) return;
  try {
    await db.execute({ sql: "ALTER TABLE courts ADD COLUMN image_url TEXT", args: [] });
  } catch (error) {
    const message = String(error?.message || "");
    if (!message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  } finally {
    imageColumnChecked = true;
  }
}

export async function listCourts(clubId, sport = null) {
  await ensureCourtImageColumn();
  const whereSport = sport ? "AND sport = ?" : "";
  const args = sport ? [clubId, sport] : [clubId];
  const rs = await db.execute({
    sql: `SELECT id, club_id, name, sport, image_url, surface, location_type, status, price_per_hour, min_duration_min
          FROM courts
          WHERE club_id = ? ${whereSport}
          ORDER BY sport, id`,
    args
  });
  return rs.rows || [];
}

export async function createCourt(payload) {
  await ensureCourtImageColumn();
  const rs = await db.execute({
    sql: `INSERT INTO courts (
            club_id, name, sport, image_url, surface, location_type, status, price_per_hour, min_duration_min
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      payload.club_id,
      payload.name,
      payload.sport,
      payload.image_url || "",
      payload.surface || "",
      payload.location_type || "",
      payload.status || "ACTIVE",
      payload.price_per_hour,
      payload.min_duration_min
    ]
  });
  return rs.rows?.[0] || null;
}

export async function updateCourt(id, payload) {
  await ensureCourtImageColumn();
  const rs = await db.execute({
    sql: `UPDATE courts
          SET name = ?, sport = ?, image_url = ?, surface = ?, location_type = ?, status = ?, price_per_hour = ?, min_duration_min = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING *`,
    args: [
      payload.name,
      payload.sport,
      payload.image_url || "",
      payload.surface || "",
      payload.location_type || "",
      payload.status || "ACTIVE",
      payload.price_per_hour,
      payload.min_duration_min,
      id
    ]
  });
  return rs.rows?.[0] || null;
}

export async function deleteCourt(id) {
  await db.execute({
    sql: "DELETE FROM courts WHERE id = ?",
    args: [id]
  });
}
