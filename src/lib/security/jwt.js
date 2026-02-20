import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("Falta JWT_SECRET");
}

const key = new TextEncoder().encode(secret);

export async function signStaffToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key);
}

export async function verifyStaffToken(token) {
  const { payload } = await jwtVerify(token, key);
  return payload;
}
