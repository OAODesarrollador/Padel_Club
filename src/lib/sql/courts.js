import { db } from "@/lib/db";

export async function listCourts(clubId, sport = null) {
  const whereSport = sport ? "AND sport = ?" : "";
  const args = sport ? [clubId, sport] : [clubId];
  const rs = await db.execute({
    sql: `SELECT id, club_id, name, sport, image_url, surface, location_type, status, price_per_hour_cents, min_duration_min
          FROM courts
          WHERE club_id = ? ${whereSport}
          ORDER BY sport, id`,
    args
  });
  return rs.rows || [];
}

export async function createCourt(payload) {
  const rs = await db.execute({
    sql: `INSERT INTO courts (
            club_id, name, sport, image_url, surface, location_type, status, price_per_hour_cents, min_duration_min
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
      payload.price_per_hour_cents,
      payload.min_duration_min
    ]
  });
  return rs.rows?.[0] || null;
}

export async function updateCourt({ id, clubId, payload }) {
  const rs = await db.execute({
    sql: `UPDATE courts
          SET name = ?, sport = ?, image_url = ?, surface = ?, location_type = ?, status = ?, price_per_hour_cents = ?, min_duration_min = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND club_id = ?
          RETURNING *`,
    args: [
      payload.name,
      payload.sport,
      payload.image_url || "",
      payload.surface || "",
      payload.location_type || "",
      payload.status || "ACTIVE",
      payload.price_per_hour_cents,
      payload.min_duration_min,
      id,
      clubId
    ]
  });
  return rs.rows?.[0] || null;
}

export async function deleteCourt({ id, clubId }) {
  const rs = await db.execute({
    sql: "DELETE FROM courts WHERE id = ? AND club_id = ? RETURNING id",
    args: [id, clubId]
  });
  return rs.rows?.[0] || null;
}
