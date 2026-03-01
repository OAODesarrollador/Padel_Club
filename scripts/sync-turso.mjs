import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import { runMigrations } from "./migrate.mjs";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function applySeed() {
  const seedPath = path.resolve(process.cwd(), "sql", "seed.sql");
  const seedSql = await fs.readFile(seedPath, "utf8");
  const statements = splitSqlStatements(seedSql);
  for (const statement of statements) {
    await db.execute(statement);
  }
  console.log("Seed sync complete");
}

async function run() {
  await runMigrations();
  await applySeed();
  console.log("Turso sync complete");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
