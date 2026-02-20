import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/security/auth";
import { getPaymentById, updatePaymentStatusById } from "@/lib/sql/payments";
import { db } from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN", "SECRETARY"]);
  if (auth.error) return auth.error;
  const payment = await getPaymentById(Number(id));
  if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  await updatePaymentStatusById(payment.id, "PAID");
  await db.execute({
    sql: "UPDATE reservations SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [payment.reservation_id]
  });
  return NextResponse.json({ ok: true });
}
