import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/security/auth";
import { deleteCourt, updateCourt } from "@/lib/sql/courts";

const schema = z.object({
  name: z.string().min(2),
  sport: z.enum(["PADEL", "FUTBOL", "TENIS"]),
  image_url: z.string().optional(),
  surface: z.string().optional(),
  location_type: z.string().optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE"]),
  price_per_hour: z.number().nonnegative(),
  min_duration_min: z.number().int().positive()
});

export async function PATCH(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const row = await updateCourt(Number(id), parsed.data);
  if (!row) return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const auth = await requireStaff(request, ["ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const deleted = await deleteCourt(Number(id));
    if (!deleted) return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("foreign key")) {
      return NextResponse.json(
        { error: "No se puede eliminar: la cancha tiene reservas o relaciones asociadas." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "No se pudo eliminar la cancha." }, { status: 500 });
  }
}
