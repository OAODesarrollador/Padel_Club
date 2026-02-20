import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { getStaffByEmail } from "@/lib/sql/auth";
import { comparePassword } from "@/lib/security/hash";
import { signStaffToken } from "@/lib/security/jwt";

export async function POST(request) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const staff = await getStaffByEmail(parsed.data.email);
  if (!staff || !staff.active) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  const ok = await comparePassword(parsed.data.password, staff.password_hash);
  if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const token = await signStaffToken({
    sub: String(staff.id),
    role: staff.role,
    club_id: staff.club_id,
    name: staff.full_name
  });

  const response = NextResponse.json({ ok: true, staff: { id: staff.id, role: staff.role, name: staff.full_name } });
  response.cookies.set("staff_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
