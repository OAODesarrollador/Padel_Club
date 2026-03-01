import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("Falta JWT_SECRET");
}

const key = new TextEncoder().encode(secret);
const VALID_ROLES = new Set(["ADMIN", "SECRETARY"]);

export async function signStaffToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key);
}

export async function verifyStaffToken(token) {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"]
  });
  const role = String(payload?.role || "");
  const clubId = Number(payload?.club_id);
  if (!VALID_ROLES.has(role) || !Number.isInteger(clubId) || clubId <= 0) {
    throw new Error("STAFF_TOKEN_CLAIMS_INVALID");
  }
  return payload;
}
