const buckets = new Map();

function key(scope, id) {
  return `${scope}:${id}`;
}

export function checkRateLimit({ scope, id, limit = 15, windowMs = 60_000 }) {
  const now = Date.now();
  const bucketKey = key(scope, id);
  const existing = buckets.get(bucketKey);
  if (!existing || existing.expiresAt <= now) {
    buckets.set(bucketKey, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  existing.count += 1;
  buckets.set(bucketKey, existing);
  return { ok: true, remaining: limit - existing.count };
}
