"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

const methods = [
  { id: "mp", label: "Mercado Pago" },
  { id: "transfer", label: "Transferencia" },
  { id: "cash", label: "Efectivo" }
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

  async function onConfirm() {
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
          return;
        }
        setMpSession(mpData);
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
    }
  }

  return (
    <div className="checkout-page">
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
      <section className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="btn btn-outline-primary btn-icon" aria-label="Volver">
            ←
          </button>
          <h1 className="text-xl font-black">Confirmar Reserva</h1>
          <span className="inline-block w-9" aria-hidden="true" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="relative h-40">
            <Image src="/ui-screens/canchaalquilada.jpg" alt="Cancha alquilada" fill className="object-cover object-[center_35%]" />
          </div>
          <div className="p-4">
            <p className="text-xs font-black uppercase text-brand">Padel</p>
            <h2 className="text-4xl font-black">{reservation?.court_name || "Cancha Premium 4"}</h2>
            <p className="text-sm text-muted">{reservation ? new Date(reservation.start_at).toLocaleString("es-AR") : "..."}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-3xl border border-line bg-white p-4">
          <h3 className="text-xl font-black">Datos Personales</h3>
          <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Nombre completo" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Correo electrónico" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
          <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Teléfono" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
          {method === "transfer" ? (
            <div className="rounded-2xl bg-[#F3F6FB] p-3 text-sm">
              <p className="font-bold">Transferencia externa</p>
              <p>Alias: {process.env.NEXT_PUBLIC_CLUB_TRANSFER_ALIAS || "club.padel.alias"}</p>
              <p>CBU: {process.env.NEXT_PUBLIC_CLUB_TRANSFER_CBU || "0000003100000000000000"}</p>
            </div>
          ) : null}
          {method === "mp" ? <div id="mp-brick-container" className="rounded-2xl border border-line p-3 text-sm text-muted">El bloque de pago de Mercado Pago se inicializa al confirmar.</div> : null}
        </div>

        <div className="space-y-2 rounded-3xl border border-line bg-white p-4">
          <h3 className="text-xl font-black">Método de Pago</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {methods.map((item) => (
              <button key={item.id} onClick={() => setMethod(item.id)} className={`btn btn-method rounded-2xl px-3 py-3 text-sm font-bold ${method === item.id ? "is-active" : ""}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="checkout-confirm-bar">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Button className="w-full" onClick={onConfirm}>
            Confirmar y pagar ${reservation ? Number(reservation.total_amount).toFixed(2) : "0.00"} →
          </Button>
        </div>
      </div>
    </div>
  );
}
