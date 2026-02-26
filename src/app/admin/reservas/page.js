"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/ui/AppScaffold";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

const sports = [
  { key: "", label: "Todos" },
  { key: "PADEL", label: "Padel" },
  { key: "FUTBOL", label: "Fútbol" },
  { key: "TENIS", label: "Tenis" }
];

const slots = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];

const statusLabels = {
  HOLD: "En espera",
  CONFIRMED: "Confirmada",
  CANCELED: "Cancelada",
  NO_SHOW: "No asistió"
};

const paymentStatusLabels = {
  UNDEFINED: "Sin definir",
  PAYMENT_PENDING: "Pago pendiente",
  PENDING_CASH: "Pendiente en efectivo",
  PENDING_TRANSFER_EXTERNAL: "Pendiente por transferencia",
  PAID: "Pagado",
  REJECTED: "Rechazado"
};

function getStatusLabel(status) {
  return statusLabels[status] || status || "Sin estado";
}

function getPaymentStatusLabel(status) {
  return paymentStatusLabels[status] || status || "Sin definir";
}

function getSportLabel(sport) {
  const found = sports.find((item) => item.key === sport);
  return found?.label || sport || "Sin deporte";
}

function buildDays() {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);
    day.setHours(0, 0, 0, 0);
    out.push(day);
  }
  return out;
}

function formatDateLabel(day) {
  return day.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function toInputDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoFromInput(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function getSlotRange(day, hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const start = new Date(day);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + 90 * 60_000);
  return { start, end };
}

function slotKey(courtId, slot) {
  return `${courtId}::${slot}`;
}

function overlaps(row, slotStart, slotEnd) {
  if (!row.start_at || !row.end_at) return false;
  const start = new Date(row.start_at);
  const end = new Date(row.end_at);
  return start < slotEnd && end > slotStart;
}

export default function AdminReservasPage() {
  const feedback = useFeedback();
  const days = useMemo(buildDays, []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [rows, setRows] = useState([]);
  const [courts, setCourts] = useState([]);
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [form, setForm] = useState(null);
  const abortRef = useRef(null);

  const dayStart = useMemo(() => {
    const d = new Date(selectedDay);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [selectedDay]);

  const dayEnd = useMemo(() => {
    const d = new Date(selectedDay);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [selectedDay]);

  async function loadCourts() {
    try {
      const response = await fetch("/api/admin/canchas", { cache: "no-store" });
      const data = await response.json();
      setCourts(data.rows || []);
    } catch {
      setCourts([]);
    }
  }

  async function loadReservations({ signal, showLoader = true } = {}) {
    if (showLoader) setLoading(true);
    try {
      const reservationsUrl = new URL("/api/admin/reservas", window.location.origin);
      reservationsUrl.searchParams.set("dateFrom", dayStart);
      reservationsUrl.searchParams.set("dateTo", dayEnd);
      reservationsUrl.searchParams.set("view", "grid");
      if (sport) reservationsUrl.searchParams.set("sport", sport);
      if (status) reservationsUrl.searchParams.set("status", status);

      const response = await fetch(reservationsUrl, { cache: "no-store", signal });
      const data = await response.json();
      if (!signal?.aborted) {
        setRows(data.rows || []);
      }
    } catch (error) {
      if (error?.name !== "AbortError" && !signal?.aborted) {
        setRows([]);
      }
    } finally {
      if (showLoader && !signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timer = setTimeout(() => {
      loadReservations({ signal: controller.signal });
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [dayStart, dayEnd, sport, status]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const visibleCourts = useMemo(() => {
    if (!sport) return courts;
    return courts.filter((c) => c.sport === sport);
  }, [courts, sport]);

  const kpis = useMemo(() => {
    const pending = rows.filter((r) => r.payment_status && r.payment_status.includes("PENDING")).length;
    const confirmed = rows.filter((r) => r.status === "CONFIRMED").length;
    const canceled = rows.filter((r) => r.status === "CANCELED").length;
    return { total: rows.length, pending, confirmed, canceled };
  }, [rows]);

  const reservationsBySlot = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      for (const slot of slots) {
        const { start, end } = getSlotRange(selectedDay, slot);
        if (overlaps(row, start, end)) {
          const key = slotKey(row.court_id, slot);
          if (!map.has(key)) map.set(key, row);
        }
      }
    }
    return map;
  }, [rows, selectedDay]);

  function getSlotReservation(courtId, slot) {
    return reservationsBySlot.get(slotKey(courtId, slot)) || null;
  }

  function openModal(row) {
    setSelectedReservation(row);
    setForm({
      status: row.status || "HOLD",
      payment_status: row.payment_status || "UNDEFINED",
      customer_name: row.customer_name || "",
      customer_phone: row.customer_phone || "",
      customer_email: row.customer_email || "",
      notes: row.notes || "",
      total_amount: Number(row.total_amount || 0),
      start_at: toInputDateTime(row.start_at),
      end_at: toInputDateTime(row.end_at)
    });
  }

  function closeModal() {
    setSelectedReservation(null);
    setForm(null);
  }

  async function saveReservation() {
    if (!selectedReservation || !form) return;
    const startAt = toIsoFromInput(form.start_at);
    const endAt = toIsoFromInput(form.end_at);
    if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Rango horario inválido.",
          fallbackSolution: "La hora de fin debe ser mayor a la de inicio."
        }),
        code: "ADMIN_RESERVATION_TIME_INVALID"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/reservas/${selectedReservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          payment_status: form.payment_status,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          customer_email: form.customer_email,
          notes: form.notes,
          total_amount: Number(form.total_amount || 0),
          start_at: startAt,
          end_at: endAt
        })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo actualizar la reserva.",
            fallbackSolution: "Revisá los datos y volvé a intentar."
          }),
          code: "ADMIN_RESERVATION_UPDATE_ERROR"
        });
        return;
      }
      feedback.showSuccess({
        title: "Reserva actualizada",
        message: "Los cambios se guardaron correctamente.",
        solution: "La grilla se refrescó con el nuevo estado."
      });
      closeModal();
      abortRef.current?.abort();
      await loadReservations({ showLoader: false });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al guardar cambios.",
          fallbackSolution: "Verificá internet y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setSaving(false);
    }
  }

  async function cancelReservation() {
    if (!selectedReservation) return;
    if (!window.confirm("¿Cancelar esta reserva?")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/reservas/${selectedReservation.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo cancelar la reserva.",
            fallbackSolution: "Reintentá en unos segundos."
          }),
          code: "ADMIN_RESERVATION_CANCEL_ERROR"
        });
        return;
      }
      feedback.showSuccess({
        title: "Reserva cancelada",
        message: `La reserva #${selectedReservation.booking_code || selectedReservation.id} fue cancelada.`,
        solution: "La celda quedó disponible en la grilla."
      });
      closeModal();
      abortRef.current?.abort();
      await loadReservations({ showLoader: false });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al cancelar reserva.",
          fallbackSolution: "Verificá internet y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-content pb-24">
      <section className="space-y-4 py-4">
        <div className="surface-card p-4">
          <h1 className="text-2xl font-black sm:text-3xl">Reservas</h1>
          <p className="text-sm text-muted">Vista de agenda por cancha y horario para gestión rápida.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">TOTAL</p>
            <p className="text-3xl font-black">{kpis.total}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">CONFIRMADAS</p>
            <p className="text-3xl font-black">{kpis.confirmed}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">PENDIENTES PAGO</p>
            <p className="text-3xl font-black">{kpis.pending}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">CANCELADAS</p>
            <p className="text-3xl font-black">{kpis.canceled}</p>
          </div>
        </div>

        <div className="surface-card p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Día</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((day) => {
              const active = day.toDateString() === selectedDay.toDateString();
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`btn btn-sm rounded-xl border px-3 py-2 text-xs font-bold btn-chip ${active ? "is-active" : ""}`}
                >
                  {formatDateLabel(day)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              {sports.map((item) => (
                <button
                  key={item.key || "all"}
                  onClick={() => setSport(item.key)}
                  className={`btn btn-sm rounded-full border px-3 py-1.5 text-xs font-bold btn-chip ${sport === item.key ? "is-active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex justify-start sm:justify-end">
              <button onClick={() => setStatus(status ? "" : "CONFIRMED")} className="btn btn-sm rounded-full border px-3 py-1.5 text-xs font-bold btn-chip">
                {status ? "Mostrar todos" : "Solo confirmadas"}
              </button>
            </div>
          </div>
        </div>

        {loading ? <p className="text-sm text-muted">Cargando grilla...</p> : null}

        <div className="space-y-4">
          {visibleCourts.map((court) => (
            <article key={court.id} className="surface-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">{court.name}</h2>
                  <p className="text-xs font-bold uppercase text-muted">{getSportLabel(court.sport)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {slots.map((slot) => {
                  const reservation = getSlotReservation(court.id, slot);
                  const isReserved = Boolean(reservation);
                  const baseClass = isReserved
                    ? reservation.status === "CANCELED"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-blue-300 bg-blue-50 text-blue-900 hover:border-blue-500"
                    : "border-slate-200 bg-white text-slate-500";
                  return (
                    <button
                      key={`${court.id}-${slot}`}
                      type="button"
                      disabled={!isReserved}
                      onClick={() => isReserved && openModal(reservation)}
                      className={`group relative rounded-xl border px-2 py-2 text-left transition ${baseClass} ${!isReserved ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <p className="text-base font-black leading-tight">{slot}</p>
                      <p className="text-[11px] uppercase">
                        {isReserved ? (reservation.customer_name || "Sin nombre") : "Libre"}
                      </p>

                      {isReserved ? (
                        <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-56 -translate-x-1/2 -translate-y-[106%] rounded-xl border border-line bg-white p-2 text-xs text-slate-700 shadow-xl md:group-hover:block">
                          <p className="font-bold">{reservation.customer_name || "Sin nombre"}</p>
                          <p>Estado: {getStatusLabel(reservation.status)}</p>
                          <p>Pago: {getPaymentStatusLabel(reservation.payment_status)}</p>
                          <p>Cancha: {reservation.court_name}</p>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}

          {!loading && visibleCourts.length === 0 ? (
            <div className="surface-card p-4 text-sm text-muted">No hay canchas para los filtros seleccionados.</div>
          ) : null}
        </div>
      </section>

      {selectedReservation && form ? (
        <div className="fixed inset-0 z-50 grid place-content-center bg-black/45 px-4 py-6">
          <div className="surface-card w-full max-w-2xl max-h-[88vh] overflow-y-auto p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-muted">Reserva #{selectedReservation.booking_code || selectedReservation.id}</p>
                <h3 className="text-xl font-black sm:text-2xl">{selectedReservation.court_name}</h3>
              </div>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={closeModal}>Cerrar</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Estado</span>
                <select className="w-full rounded-xl border border-line px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="HOLD">En espera</option>
                  <option value="CONFIRMED">Confirmada</option>
                  <option value="CANCELED">Cancelada</option>
                  <option value="NO_SHOW">No asistió</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted">Estado de cobro</span>
                <select
                  className="w-full rounded-xl border border-line px-3 py-2"
                  value={form.payment_status}
                  onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
                >
                  <option value="UNDEFINED">Sin definir</option>
                  <option value="PAYMENT_PENDING">Pago pendiente</option>
                  <option value="PENDING_CASH">Pendiente en efectivo</option>
                  <option value="PENDING_TRANSFER_EXTERNAL">Pendiente por transferencia</option>
                  <option value="PAID">Pagado</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted">Inicio</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-line px-3 py-2"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted">Fin</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-line px-3 py-2"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted">Cliente</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted">Teléfono</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </label>

              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted">Email</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
              </label>

              <label className="text-sm">
                <span className="mb-1 block text-muted">Total</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-line px-3 py-2"
                  value={form.total_amount}
                  onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                />
              </label>

              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted">Notas</span>
                <textarea className="w-full rounded-xl border border-line px-3 py-2" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-primary w-full" onClick={saveReservation} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" className="btn btn-danger w-full" onClick={cancelReservation} disabled={saving}>
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav
        items={[
          { href: "/admin/reservas", label: "Reservas", icon: "📅", active: true },
          { href: "/admin/canchas", label: "Canchas", icon: "🎾" },
          { href: "/admin/eventos", label: "Eventos", icon: "🏆" },
          { href: "/admin/ajustes", label: "Ajustes", icon: "⚙️" }
        ]}
      />
    </div>
  );
}
