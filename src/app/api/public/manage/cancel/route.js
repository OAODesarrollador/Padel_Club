import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelByManageToken, getReservationByManageToken } from "@/lib/sql/reservations";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp } from "@/lib/security/auth";

const schema = z.object({
  token: z.string().min(10),
  reason: z.string().optional()
});

export async function POST(request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ip = getClientIp(request);
  const ipGuard = checkRateLimit({ scope: "manage-cancel-ip", id: ip, limit: 8, windowMs: 60_000 });
  if (!ipGuard.ok) return NextResponse.json({ error: "Rate limit IP" }, { status: 429 });
  const phoneGuard = checkRateLimit({ scope: "manage-cancel-token", id: parsed.data.token, limit: 5, windowMs: 60_000 });
  if (!phoneGuard.ok) return NextResponse.json({ error: "Rate limit token" }, { status: 429 });
  const reservation = await getReservationByManageToken(parsed.data.token);
  const phoneId = reservation?.customer_phone || "unknown";
  const byPhone = checkRateLimit({ scope: "manage-cancel-phone", id: phoneId, limit: 5, windowMs: 60_000 });
  if (!byPhone.ok) return NextResponse.json({ error: "Límite de intentos por teléfono" }, { status: 429 });

  const canceled = await cancelByManageToken(parsed.data);
  if (!canceled) return NextResponse.json({ error: "No se pudo cancelar" }, { status: 400 });
  return NextResponse.json({ ok: true, reservation: canceled });
}
