import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyStaffToken } from "@/lib/security/jwt";

export async function requireStaff(request, requiredRoles = ["ADMIN", "SECRETARY"]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const payload = await verifyStaffToken(token);
    if (!requiredRoles.includes(payload.role)) {
      return { error: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }) };
    }
    return { staff: payload };
  } catch {
    return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
  }
}

export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
