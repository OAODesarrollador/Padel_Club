import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("Falta TURSO_DATABASE_URL");
}

export const db = createClient({
  url,
  authToken
});

export async function tx(callback) {
  const transaction = await db.transaction("write");
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function nowUtcIso() {
  const result = await db.execute("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') as now_utc");
  return result.rows?.[0]?.now_utc;
}
