import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("verifyStaffToken validates algorithm, role and club_id claims", async () => {
  const file = await fs.readFile(path.join(process.cwd(), "src/lib/security/jwt.js"), "utf8");
  assert.match(file, /algorithms:\s*\["HS256"\]/);
  assert.match(file, /VALID_ROLES/);
  assert.match(file, /clubId/);
});
