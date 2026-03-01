import crypto from "crypto";

export function verifyWebhookSignature(rawBody, request) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const signatureHeader = request.headers.get("x-signature");
  if (!signatureHeader) return false;

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.ts}.${rawBody}`)
    .digest("hex");
  return timingSafeHexEqual(hmac, parsed.v1);
}

export function mapMpStatusToPaymentStatus(mpStatus) {
  if (mpStatus === "approved") return "PAID";
  if (mpStatus === "pending" || mpStatus === "in_process") return "PENDING";
  return "REJECTED";
}

function parseSignatureHeader(value) {
  const parts = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;

  const kv = {};
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (!k || !v) return null;
    kv[k] = v;
  }
  if (!kv.ts || !kv.v1) return null;
  if (!/^\d+$/.test(kv.ts)) return null;
  if (!/^[a-fA-F0-9]{64}$/.test(kv.v1)) return null;
  return { ts: kv.ts, v1: kv.v1.toLowerCase() };
}

function timingSafeHexEqual(leftHex, rightHex) {
  const left = Buffer.from(String(leftHex), "hex");
  const right = Buffer.from(String(rightHex), "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
