export function localYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseYmdOrToday(ymd) {
  const today = new Date();
  const fallback = {
    y: today.getUTCFullYear(),
    m: today.getUTCMonth() + 1,
    d: today.getUTCDate()
  };
  const [yRaw, mRaw, dRaw] = String(ymd || "").split("-").map(Number);
  const y = Number.isFinite(yRaw) && yRaw > 2000 ? yRaw : fallback.y;
  const m = Number.isFinite(mRaw) && mRaw >= 1 && mRaw <= 12 ? mRaw : fallback.m;
  const d = Number.isFinite(dRaw) && dRaw >= 1 && dRaw <= 31 ? dRaw : fallback.d;
  return { y, m, d };
}

export function utcDayRangeFromYmd(ymd) {
  const { y, m, d } = parseYmdOrToday(ymd);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59)).toISOString();
  return { start, end };
}

export function parseUtcDate(value) {
  if (!value) return null;
  const raw = String(value);
  if (/[zZ]$|[+\-]\d{2}:\d{2}$/.test(raw)) {
    return new Date(raw);
  }
  const normalized = raw.includes("T") ? `${raw}Z` : `${raw.replace(" ", "T")}Z`;
  return new Date(normalized);
}
