import { writeMessageLog } from "@/lib/sql/audit";

function cleanPhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function formatDateTime(iso) {
  const date = new Date(iso);
  return {
    fecha: date.toLocaleDateString("es-AR"),
    hora: date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  };
}

export function buildClientMessage({ reservation, manageToken }) {
  const { fecha, hora } = formatDateTime(reservation.start_at);
  return [
    `Hola ${reservation.customer_name || "cliente"},`,
    "",
    "Tu reserva fue confirmada:",
    `Codigo: ${reservation.booking_code}`,
    `Cancha: ${reservation.court_name}`,
    `Fecha: ${fecha}`,
    `Hora: ${hora}`,
    "",
    "Token de gestion (copiar y pegar en la app):",
    `${manageToken || "-"}`,
    "",
    "Ruta para gestionar: /gestionar",
    "",
    "Gracias por reservar en Club Deportivo."
  ].join("\n");
}

export function buildClubMessage({ reservation }) {
  const { fecha, hora } = formatDateTime(reservation.start_at);
  return [
    "Nueva reserva confirmada",
    `Codigo: ${reservation.booking_code}`,
    `Cliente: ${reservation.customer_name || "-"}`,
    `Telefono: ${reservation.customer_phone || "-"}`,
    `Cancha: ${reservation.court_name || reservation.court_id || "-"}`,
    `Fecha: ${fecha}`,
    `Hora: ${hora}`,
    `Pago: ${reservation.payment_method || "-"} (${reservation.payment_status || "-"})`
  ].join("\n");
}

export async function buildWaLink({ phone, message, logPayload }) {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone(phone)}?text=${encoded}`;
  if (logPayload) {
    await writeMessageLog({
      ...logPayload,
      body: message,
      metadata_json: { wa_url: url }
    });
  }
  return url;
}
