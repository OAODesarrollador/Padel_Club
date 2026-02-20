import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/security/auth";
import { deleteEvent, updateEvent } from "@/lib/sql/events";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sport: z.enum(["PADEL", "FUTBOL", "TENIS"]),
  starts_at: z.string().datetime(),
  spots_left: z.number().int().nonnegative(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  image_url: z.string().optional()
});

export async function PATCH(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const row = await updateEvent(Number(id), parsed.data);
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  await deleteEvent(Number(id));
  return NextResponse.json({ ok: true });
}
