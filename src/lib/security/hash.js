import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(value) {
  return bcrypt.hash(value, 10);
}

export async function comparePassword(value, hash) {
  if (!String(hash).startsWith("$2")) {
    return value === hash;
  }
  return bcrypt.compare(value, hash);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateManageToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function bookingCode() {
  const part = crypto.randomBytes(2).toString("hex").toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PX-${part}${num}`;
}
