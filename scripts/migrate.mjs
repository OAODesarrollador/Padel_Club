import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const MIGRATIONS_DIR = path.resolve(process.cwd(), "sql", "migrations");
const BASE_SCHEMA_PATH = path.resolve(process.cwd(), "sql", "schema.sql");
const IGNORABLE_ERRORS = [
  "duplicate column",
  "already exists",
  "no such column"
];

function isIgnorable(error) {
  const message = String(error?.message || "").toLowerCase();
  return IGNORABLE_ERRORS.some((entry) => message.includes(entry));
}

function splitSqlStatements(sql) {
  const lines = String(sql).split(/\r?\n/);
  const out = [];
  let current = [];
  let inTrigger = false;

  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim().toUpperCase();
    if (!trimmed || trimmed.startsWith("--")) continue;

    if (trimmed.startsWith("CREATE TRIGGER")) {
      inTrigger = true;
    }

    current.push(line);

    if (inTrigger) {
      if (trimmed === "END;" || trimmed === "END") {
        out.push(current.join("\n").trim().replace(/;$/, ""));
        current = [];
        inTrigger = false;
      }
      continue;
    }

    if (trimmed.endsWith(";")) {
      out.push(current.join("\n").trim().replace(/;$/, ""));
      current = [];
    }
  }

  if (current.length > 0) {
    out.push(current.join("\n").trim().replace(/;$/, ""));
  }
  return out.filter(Boolean);
}

async function ensureMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureBaseSchema() {
  const rs = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='clubs' LIMIT 1"
  );
  if (rs.rows?.[0]?.name === "clubs") return;

  const schemaSql = await fs.readFile(BASE_SCHEMA_PATH, "utf8");
  const statements = splitSqlStatements(schemaSql);
  for (const statement of statements) {
    await db.execute(statement);
  }
  console.log("Base schema applied");
}

async function getAppliedMigrations() {
  const rs = await db.execute("SELECT filename FROM schema_migrations");
  return new Set((rs.rows || []).map((row) => String(row.filename)));
}

async function readMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function run() {
  await ensureBaseSchema();
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = await readMigrationFiles();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = (await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8")).trim();
    if (!sql) {
      await db.execute({
        sql: "INSERT INTO schema_migrations (filename) VALUES (?)",
        args: [file]
      });
      continue;
    }

    try {
      await db.execute(sql);
      console.log(`Applied ${file}`);
    } catch (error) {
      if (!isIgnorable(error)) throw error;
      console.log(`Skipped ${file} (${String(error.message)})`);
    }

    await db.execute({
      sql: "INSERT INTO schema_migrations (filename) VALUES (?)",
      args: [file]
    });
  }

  console.log("Migrations complete");
}

export { run as runMigrations };

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
