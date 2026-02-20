import Link from "next/link";
import { getReservationByCode } from "@/lib/sql/reservations";
import { buildClientMessage, buildWaLink } from "@/lib/whatsapp/templates";
import { Button } from "@/components/ui/Button";

export default async function ConfirmacionPage({ params, searchParams }) {
  const { bookingCode } = await params;
  const query = await searchParams;
  const reservation = await getReservationByCode(bookingCode);
  if (!reservation) {
    return <div className="p-6 text-center">Reserva no encontrada</div>;
  }

  const manageToken = query?.token || "";
  const msg = buildClientMessage({ reservation, manageToken });
  const waUrl = await buildWaLink({
    phone: reservation.customer_phone || "",
    message: msg,
    logPayload: {
      club_id: reservation.club_id,
      reservation_id: reservation.id,
      recipient: reservation.customer_phone
    }
  });

  return (
    <div className="min-h-dvh p-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 text-center shadow-soft">
        <div className="mx-auto mb-4 grid h-20 w-20 place-content-center rounded-full bg-brand text-5xl font-black text-white">✓</div>
        <h1 className="text-5xl font-black">¡Reserva Confirmada!</h1>
        <p className="mt-2 text-muted">Tu turno ha sido agendado con éxito.</p>

        <div className="mx-auto mt-4 inline-flex rounded-2xl bg-[#F3F6FB] px-4 py-3 text-2xl font-black">#{reservation.booking_code}</div>
        <div className="mt-5 space-y-2 text-left">
          <p><span className="font-bold">Cancha:</span> {reservation.court_name}</p>
          <p><span className="font-bold">Fecha:</span> {new Date(reservation.start_at).toLocaleDateString("es-AR")}</p>
          <p><span className="font-bold">Hora:</span> {new Date(reservation.start_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        <div className="mt-6 space-y-3">
          <Link href={manageToken ? `/gestionar?token=${encodeURIComponent(manageToken)}` : `/gestionar?code=${reservation.booking_code}`}><Button className="w-full">Ver detalle de reserva</Button></Link>
          <Link href="/"><Button variant="secondary" className="w-full">Volver al inicio</Button></Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="mb-3 text-sm text-muted">Compartir comprobante</p>
        <a href={waUrl} className="inline-grid h-14 w-14 place-content-center rounded-full border border-line bg-white text-2xl shadow-soft">🟢</a>
      </div>
    </div>
  );
}
