const buckets = new Map();
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = Boolean(redisUrl && redisToken);

function key(scope, id) {
  return `${scope}:${id}`;
}

export async function checkRateLimit({ scope, id, limit = 15, windowMs = 60_000 }) {
  if (hasRedis) {
    return checkRateLimitRedis({ scope, id, limit, windowMs });
  }
  return checkRateLimitMemory({ scope, id, limit, windowMs });
}

function checkRateLimitMemory({ scope, id, limit = 15, windowMs = 60_000 }) {
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

async function checkRateLimitRedis({ scope, id, limit = 15, windowMs = 60_000 }) {
  const now = Date.now();
  const resetAt = now + windowMs;
  const bucketKey = key(scope, id);
  const ttlSeconds = Math.ceil(windowMs / 1000);

  const payload = {
    key: `ratelimit:${bucketKey}`,
    windowMs,
    ttlSeconds,
    limit,
    now,
    resetAt
  };

  const response = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      ["INCR", payload.key],
      ["EXPIRE", payload.key, payload.ttlSeconds, "NX"],
      ["PTTL", payload.key]
    ]),
    cache: "no-store"
  });

  if (!response.ok) {
    return checkRateLimitMemory({ scope, id, limit, windowMs });
  }

  const data = await response.json();
  const currentCount = Number(data?.[0]?.result || 0);
  const pttl = Number(data?.[2]?.result || 0);
  const remaining = Math.max(0, limit - currentCount);

  return {
    ok: currentCount <= limit,
    remaining,
    resetAt: pttl > 0 ? now + pttl : resetAt
  };
}
