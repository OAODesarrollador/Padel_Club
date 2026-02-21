"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-1">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase text-indigo-400 leading-tight">{label}</p>
        <p className="truncate text-sm font-bold text-indigo-900 leading-tight">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-200 active:scale-95"
      >
        {copied ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/* Íconos SVG inline para cada método de pago */
function IconMP() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="checkout-method-icon">
      <rect width="32" height="32" rx="8" fill="#009EE3" />
      <path d="M7 16c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="11" cy="19" r="2" fill="#fff" />
      <circle cx="21" cy="19" r="2" fill="#fff" />
    </svg>
  );
}
function IconTransfer() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="checkout-method-icon">
      <rect width="32" height="32" rx="8" fill="#6366f1" />
      <path d="M9 13h14M9 19h9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 16l3 3-3 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCash() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="checkout-method-icon">
      <rect width="32" height="32" rx="8" fill="#22c55e" />
      <rect x="5" y="10" width="22" height="14" rx="3" stroke="#fff" strokeWidth="2.5" />
      <circle cx="16" cy="17" r="3" stroke="#fff" strokeWidth="2" />
      <path d="M9 10V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

const methods = [
  { id: "mp", label: "MercadoPago", Icon: IconMP },
  { id: "transfer", label: "Transferencia", Icon: IconTransfer },
  { id: "cash", label: "Efectivo", Icon: IconCash }
];

export default function CheckoutPage({ params }) {
  const { bookingCode } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const feedback = useFeedback();
  const manageToken = search.get("token") || "";
  const [reservation, setReservation] = useState(null);
  const [method, setMethod] = useState("mp");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: ""
  });
  const [mpSession, setMpSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/public/reservations/summary?code=${bookingCode}`)
      .then((r) => r.json())
      .then((data) => setReservation(data.reservation || null));
  }, [bookingCode]);

  useEffect(() => {
    if (!mpSession || !window.MercadoPago) return;
    const bricks = new window.MercadoPago(mpSession.public_key, { locale: "es-AR" }).bricks();
    bricks
      .create("wallet", "mp-brick-container", {
        initialization: { preferenceId: mpSession.preference_id },
        customization: { texts: { valueProp: "smart_option" } },
        callbacks: {
          onError: () => {
            if (mpSession.init_point) window.location.href = mpSession.init_point;
          }
        }
      })
      .catch(() => {
        if (mpSession.init_point) window.location.href = mpSession.init_point;
      });
  }, [mpSession]);

  /* Helpers de formato de fecha */
  function fmtDate(iso) {
    if (!iso) return "...";
    return new Date(iso).toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }
  function fmtTime(iso) {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDuration(start, end) {
    if (!start || !end) return "";
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    return `(${mins} min)`;
  }

  async function onConfirm() {
    setLoading(true);
    try {
      const confirmResponse = await fetch("/api/public/reservations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: 1,
          booking_code: bookingCode,
          payment_ui_method: method,
          ...form
        })
      });
      const confirmData = await confirmResponse.json();
      if (!confirmResponse.ok) {
        feedback.showError({
          ...mapApiError({
            error: confirmData?.error,
            status: confirmResponse.status,
            fallbackMessage: "No se pudo confirmar la reserva.",
            fallbackSolution: "Verificá tus datos y repetí la confirmación."
          }),
          code: "RESERVATION_CONFIRM_ERROR"
        });
        setLoading(false);
        return;
      }

      if (method === "mp") {
        const mpResp = await fetch("/api/payments/mp/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_code: bookingCode,
            ui_method: method
          })
        });
        const mpData = await mpResp.json();
        if (!mpResp.ok) {
          feedback.showError({
            ...mapApiError({
              error: mpData?.error,
              status: mpResp.status,
              fallbackMessage: "No se pudo iniciar Mercado Pago.",
              fallbackSolution: "Intentá nuevamente o elegí otro medio de pago."
            }),
            code: "MP_CREATE_ERROR"
          });
          setLoading(false);
          return;
        }
        setMpSession(mpData);
        setLoading(false);
        return;
      }

      router.push(`/confirmacion/${bookingCode}?token=${encodeURIComponent(manageToken)}`);
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al confirmar.",
          fallbackSolution: "Revisá internet y volvé a intentar."
        }),
        code: "NETWORK_ERROR"
      });
      setLoading(false);
    }
  }

  const total = reservation ? Number(reservation.total_amount).toFixed(2) : "0.00";

  return (
    <div className="checkout-page">
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
      <section className="space-y-4 p-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="btn btn-outline-primary btn-icon" aria-label="Volver">
            ←
          </button>
          <h1 className="text-xl font-black">Confirmar Reserva</h1>
          <span className="inline-block w-9" aria-hidden="true" />
        </div>

        {/* Summary Card */}
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="relative h-44">
            <Image src="/ui-screens/canchaalquilada.jpg" alt="Cancha alquilada" fill className="object-cover object-[center_35%]" />
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase text-brand">Padel</p>
                <h2 className="text-3xl font-black leading-tight">
                  {reservation?.court_name || "Cancha Premium 4"}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-green-600">${total}</p>
                <p className="text-[10px] font-bold uppercase text-muted">Precio total</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-muted capitalize">
                📅 {fmtDate(reservation?.start_at)}
              </p>
              {reservation?.start_at && reservation?.end_at && (
                <p className="text-sm text-muted">
                  🕐 {fmtTime(reservation.start_at)} – {fmtTime(reservation.end_at)}{" "}
                  <span className="text-xs">{fmtDuration(reservation.start_at, reservation.end_at)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="space-y-3 rounded-3xl border border-line bg-white p-4">
          <h3 className="text-base font-black">Datos Personales</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Nombre completo</span>
              <input
                className="w-full rounded-xl border border-line bg-[#F8F9FC] px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Juan Pérez"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Correo electrónico</span>
              <input
                className="w-full rounded-xl border border-line bg-[#F8F9FC] px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="juan@ejemplo.com"
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Teléfono</span>
              <input
                className="w-full rounded-xl border border-line bg-[#F8F9FC] px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="+54 9 11 1234-5678"
                type="tel"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-3 rounded-3xl border border-line bg-white p-4">
          <h3 className="text-base font-black">Método de Pago</h3>
          <div className="grid grid-cols-3 gap-2">
            {methods.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`checkout-method-card ${method === id ? "is-active" : ""}`}
              >
                <Icon />
                <span className="mt-1.5 text-xs font-bold leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {/* Detalles según método */}
          {method === "mp" && !mpSession && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              El botón de MercadoPago aparecerá al confirmar.
            </div>
          )}
          {method === "mp" && mpSession && (
            <div id="mp-brick-container" className="rounded-2xl border border-line p-3" />
          )}
          {method === "transfer" && (
            <div className="space-y-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 p-2.5">
              <p className="text-[10px] font-bold text-indigo-500 uppercase px-0.5">Datos Bancarios</p>
              <CopyField
                label="Titular"
                value={process.env.NEXT_PUBLIC_CLUB_TRANSFER_TITULAR || process.env.CLUB_TRANSFER_INFO_TITULAR || "Nombre del Titular"}
              />
              <CopyField
                label="Alias"
                value={process.env.NEXT_PUBLIC_CLUB_TRANSFER_ALIAS || "club.padel.alias"}
              />
              <CopyField
                label="CBU"
                value={process.env.NEXT_PUBLIC_CLUB_TRANSFER_CBU || "0000003100000000000000"}
              />
              <p className="text-[10px] text-indigo-400 px-0.5 mt-1 border-t border-indigo-100 pt-1">
                Enviá el comprobante por WhatsApp para confirmar.
              </p>
            </div>
          )}
          {method === "cash" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Pagás en el club al momento de jugar. Presentá este código de reserva.
            </div>
          )}
        </div>

      </section>

      {/* Sticky confirm bar */}
      <div className="checkout-confirm-bar">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Button className="w-full" onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando…" : `Confirmar y pagar $${total} →`}
          </Button>
        </div>
      </div>
    </div>
  );
}
