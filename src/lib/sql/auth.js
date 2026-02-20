import { db } from "@/lib/db";

export async function getStaffByEmail(email) {
  const rs = await db.execute({
    sql: `SELECT id, club_id, email, password_hash, full_name, role, active
          FROM staff_users
          WHERE email = ?`,
    args: [email]
  });
  return rs.rows?.[0] || null;
}
