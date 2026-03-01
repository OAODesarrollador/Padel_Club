import { NextResponse } from "next/server";
import { z } from "zod";
import { createPreference } from "@/lib/mp/client";
import { createPayment } from "@/lib/sql/payments";
import { getReservationByCode } from "@/lib/sql/reservations";
import { centsToAmount } from "@/lib/utils";
import { getPublicClubId } from "@/lib/config/club";

const schema = z.object({
  booking_code: z.string().min(3),
  ui_method: z.enum(["mp"])
});

function normalizeAbsoluteUrl(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return url.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function resolveSiteUrl(request) {
  const byRequest = normalizeAbsoluteUrl(new URL(request.url).origin);
  const byPublicEnv = normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL);
  const byVercelEnv = normalizeAbsoluteUrl(process.env.VERCEL_URL);
  return byPublicEnv || byVercelEnv || byRequest || "http://localhost:3000";
}

export async function POST(request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reservation = await getReservationByCode(parsed.data.booking_code, getPublicClubId());
  if (!reservation) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (reservation.status !== "HOLD" || reservation.payment_status !== "PAYMENT_PENDING") {
    return NextResponse.json(
      { error: "La reserva no está lista para iniciar pago online." },
      { status: 409 }
    );
  }

  const site = resolveSiteUrl(request);
  const isLocal = site.includes("localhost") || site.includes("127.0.0.1");

  const preferencePayload = {
    items: [
      {
        title: `Reserva ${reservation.booking_code} - ${reservation.court_name}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: centsToAmount(reservation.total_amount_cents)
      }
    ],
    external_reference: reservation.booking_code,
    back_urls: {
      success: `${site}/confirmacion/${reservation.booking_code}`,
      pending: `${site}/confirmacion/${reservation.booking_code}`,
      failure: `${site}/checkout/${reservation.booking_code}`
    },
    metadata: {
      booking_code: reservation.booking_code,
      reservation_id: reservation.id,
      ui_method: parsed.data.ui_method
    }
  };

  if (!isLocal) {
    preferencePayload.auto_return = "approved";
    preferencePayload.notification_url = `${site}/api/payments/mp/webhook`;
  }

  const preference = await createPreference(preferencePayload);

  await createPayment({
    club_id: reservation.club_id,
    reservation_id: reservation.id,
    method: "WALLET_MP",
    amount_cents: reservation.total_amount_cents,
    status: "PENDING",
    mp_preference_id: preference.id,
    raw_payload: preference
  });

  return NextResponse.json({
    ok: true,
    preference_id: preference.id,
    init_point: preference.init_point,
    sandbox_init_point: preference.sandbox_init_point,
    public_key: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
  });
}
