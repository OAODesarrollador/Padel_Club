import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/security/auth";
import { writeAuditLog } from "@/lib/sql/audit";

const patchSchema = z.object({
  status: z.enum(["HOLD", "CONFIRMED", "CANCELED", "NO_SHOW"]).optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  payment_status: z.string().optional()
});

export async function PATCH(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN", "SECRETARY"]);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const fields = [];
  const args = [];
  for (const [k, v] of Object.entries(parsed.data)) {
    fields.push(`${k} = ?`);
    args.push(v);
  }
  if (fields.length === 0) return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  args.push(Number(id));

  const rs = await db.execute({
    sql: `UPDATE reservations SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
    args
  });
  const row = rs.rows?.[0];
  if (!row) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  await writeAuditLog({
    club_id: row.club_id,
    staff_user_id: Number(auth.staff.sub),
    action: "ADMIN_PATCH_RESERVATION",
    resource: "reservation",
    resource_id: row.id,
    payload_json: parsed.data
  });
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN", "SECRETARY"]);
  if (auth.error) return auth.error;
  const rs = await db.execute({
    sql: `UPDATE reservations
          SET status = 'CANCELED', cancel_reason = 'ADMIN_CANCEL', canceled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING *`,
    args: [Number(id)]
  });
  const row = rs.rows?.[0];
  if (!row) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  await writeAuditLog({
    club_id: row.club_id,
    staff_user_id: Number(auth.staff.sub),
    action: "ADMIN_CANCEL_RESERVATION",
    resource: "reservation",
    resource_id: row.id
  });
  return NextResponse.json({ ok: true });
}
