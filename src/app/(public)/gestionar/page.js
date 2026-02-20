"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

export default function GestionarPage() {
  const search = useSearchParams();
  const tokenFromQuery = search.get("token") || "";
  const code = search.get("code");
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [manageToken, setManageToken] = useState(tokenFromQuery);
  const feedback = useFeedback();

  async function load(tokenValue = manageToken) {
    if (!tokenValue) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/public/manage?token=${encodeURIComponent(tokenValue)}`);
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo cargar la reserva.",
            fallbackSolution: "Verificá que el link/token sea correcto."
          }),
          code: "MANAGE_LOAD_ERROR"
        });
        setReservation(null);
        return;
      }
      setReservation(data.reservation || null);
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al cargar gestión.",
          fallbackSolution: "Revisá tu conexión y probá nuevamente."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenFromQuery) {
      setManageToken(tokenFromQuery);
      load(tokenFromQuery);
    }
  }, [tokenFromQuery]);

  async function cancel() {
    try {
      const response = await fetch("/api/public/manage/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manageToken })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo cancelar la reserva.",
            fallbackSolution: "Probá nuevamente en unos segundos."
          }),
          code: "MANAGE_CANCEL_ERROR"
        });
        return;
      }
      await load();
      feedback.showSuccess({
        title: "Reserva cancelada",
        message: "La reserva se canceló correctamente.",
        solution: "Si querés, podés crear una nueva reserva desde la agenda."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al cancelar.",
          fallbackSolution: "Verificá internet y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    }
  }

  async function reschedule() {
    try {
      const response = await fetch("/api/public/manage/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: manageToken,
          new_start_at: new Date(newStart).toISOString(),
          new_end_at: new Date(newEnd).toISOString()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo reprogramar la reserva.",
            fallbackSolution: "Elegí otro horario y confirmá de nuevo."
          }),
          code: "MANAGE_RESCHEDULE_ERROR"
        });
        return;
      }
      feedback.showSuccess({
        title: "Reserva reprogramada",
        message: "Se actualizó el turno y se generó un nuevo token de gestión.",
        solution: `Guardá este token: ${data.manageToken}`
      });
      await load();
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al reprogramar.",
          fallbackSolution: "Revisá internet y volvé a intentar."
        }),
        code: "NETWORK_ERROR"
      });
    }
  }

  return (
    <div>
      <section className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-block w-9" aria-hidden="true" />
          <h1 className="text-xl font-black">Gestionar Reserva</h1>
          <span className="inline-block w-9" aria-hidden="true" />
        </div>

        {!tokenFromQuery ? (
          <div className="surface-card space-y-3 p-4">
            <p className="text-sm text-muted">Pegá tu token de gestión para ver o modificar tu reserva.</p>
            <input
              className="w-full rounded-xl border border-line px-3 py-2"
              placeholder="Token de gestión"
              value={manageToken}
              onChange={(e) => setManageToken(e.target.value.trim())}
            />
            <Button onClick={load} disabled={!manageToken}>Buscar reserva</Button>
          </div>
        ) : null}
        {code ? <p className="text-sm text-muted">Código: {code}</p> : null}
        {loading ? <p>Cargando...</p> : null}
        {reservation ? (
          <div className="space-y-4 rounded-3xl border border-line bg-white p-4">
            <h2 className="text-2xl font-black">{reservation.booking_code}</h2>
            <p>{reservation.court_name}</p>
            <p>{new Date(reservation.start_at).toLocaleString("es-AR")}</p>
            <p className="text-sm text-muted">Estado: {reservation.status}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <input type="datetime-local" className="rounded-xl border border-line px-3 py-2" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              <input type="datetime-local" className="rounded-xl border border-line px-3 py-2" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={reschedule}>Reprogramar</Button>
              <Button variant="danger" onClick={cancel}>Cancelar</Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
