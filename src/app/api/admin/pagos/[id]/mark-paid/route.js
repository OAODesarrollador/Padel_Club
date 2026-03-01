import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/security/auth";
import { getPaymentById, updatePaymentStatusById } from "@/lib/sql/payments";
import { db } from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN", "SECRETARY"]);
  if (auth.error) return auth.error;
  const clubId = Number(auth.staff.club_id);
  const payment = await getPaymentById({ id: Number(id), clubId });
  if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  await updatePaymentStatusById({ id: payment.id, clubId, status: "PAID" });
  await db.execute({
    sql: `UPDATE reservations
          SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND club_id = ?`,
    args: [payment.reservation_id, clubId]
  });
  return NextResponse.json({ ok: true });
}
