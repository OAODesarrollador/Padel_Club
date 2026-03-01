import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { getStaffByEmail, updateStaffPasswordHash } from "@/lib/sql/auth";
import { comparePassword, hashPassword } from "@/lib/security/hash";
import { signStaffToken } from "@/lib/security/jwt";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, shouldUseSecureCookies } from "@/lib/security/auth";

export async function POST(request) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ip = getClientIp(request);
  const guardByIp = await checkRateLimit({ scope: "admin-login-ip", id: ip, limit: 10, windowMs: 60_000 });
  if (!guardByIp.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  const guardByEmail = await checkRateLimit({
    scope: "admin-login-email",
    id: String(parsed.data.email).toLowerCase(),
    limit: 5,
    windowMs: 60_000
  });
  if (!guardByEmail.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const staff = await getStaffByEmail(parsed.data.email);
  if (!staff || !staff.active) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  let ok = await comparePassword(parsed.data.password, staff.password_hash);
  let effectiveStaff = staff;
  if (!ok && !String(staff.password_hash || "").startsWith("$2")) {
    if (parsed.data.password === String(staff.password_hash || "")) {
      const migratedHash = await hashPassword(parsed.data.password);
      const migrated = await updateStaffPasswordHash({ id: Number(staff.id), passwordHash: migratedHash });
      if (migrated) {
        effectiveStaff = migrated;
        ok = true;
      }
    }
  }
  if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const token = await signStaffToken({
    sub: String(effectiveStaff.id),
    role: effectiveStaff.role,
    club_id: effectiveStaff.club_id,
    name: effectiveStaff.full_name
  });

  const response = NextResponse.json({
    ok: true,
    staff: { id: effectiveStaff.id, role: effectiveStaff.role, name: effectiveStaff.full_name }
  });
  const secureCookie = shouldUseSecureCookies(request);
  response.cookies.set("staff_token", token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
