import crypto from "crypto";

export function verifyWebhookSignature(rawBody, request) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const signatureHeader = request.headers.get("x-signature") || request.headers.get("x-mp-signature");
  if (!signatureHeader) return false;

  if (signatureHeader === secret) return true;

  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return signatureHeader.includes(hmac);
}

export function mapMpStatusToPaymentStatus(mpStatus) {
  if (mpStatus === "approved") return "PAID";
  if (mpStatus === "pending" || mpStatus === "in_process") return "PENDING";
  return "REJECTED";
}
