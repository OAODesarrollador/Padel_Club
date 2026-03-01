import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("webhook verification uses strict header parse and timing-safe compare", async () => {
  const file = await fs.readFile(path.join(process.cwd(), "src/lib/mp/webhook.js"), "utf8");
  assert.match(file, /parseSignatureHeader/);
  assert.match(file, /crypto\.timingSafeEqual/);
  assert.match(file, /x-signature/);
  assert.doesNotMatch(file, /includes\(hmac\)/);
});
