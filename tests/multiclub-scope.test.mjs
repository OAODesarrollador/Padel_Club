import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

async function read(relPath) {
  return fs.readFile(path.join(root, relPath), "utf8");
}

test("admin reservation mutation routes enforce club scope", async () => {
  const route = await read("src/app/api/admin/reservas/[id]/route.js");
  assert.match(route, /WHERE id = \? AND club_id = \?/);
});

test("admin payment mark-paid route enforces club scope", async () => {
  const route = await read("src/app/api/admin/pagos/[id]/mark-paid/route.js");
  assert.match(route, /WHERE id = \? AND club_id = \?/);
});
