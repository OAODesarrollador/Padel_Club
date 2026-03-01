import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyStaffToken } from "@/lib/security/jwt";

export async function requireStaff(request, requiredRoles = ["ADMIN", "SECRETARY"]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value || request.cookies?.get("staff_token")?.value;
  if (!token) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  try {
    const payload = await verifyStaffToken(token);
    const role = String(payload.role || "");
    const clubId = Number(payload.club_id);
    if (!requiredRoles.includes(role)) {
      return { error: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }) };
    }
    if (!Number.isInteger(clubId) || clubId <= 0) {
      return { error: NextResponse.json({ error: "Token inválido" }, { status: 401 }) };
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

export function shouldUseSecureCookies(request) {
  const forwarded = request?.headers?.get?.("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  try {
    return new URL(request?.url || "").protocol === "https:";
  } catch {
    return false;
  }
}
