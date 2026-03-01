import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("comparePassword does not allow plaintext fallback", async () => {
  const file = await fs.readFile(path.join(process.cwd(), "src/lib/security/hash.js"), "utf8");
  assert.doesNotMatch(file, /value\s*===\s*hash/);
  assert.match(file, /startsWith\("\$2"\)/);
});
