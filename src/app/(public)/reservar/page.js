"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";
import { localYmd, parseUtcDate } from "@/lib/datetime";

const sports = [
  { key: "PADEL", label: "Padel" },
  { key: "FUTBOL", label: "Fútbol" },
  { key: "TENIS", label: "Tenis" }
];

const slots = ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00", "21:30"];

function buildDates() {
  const out = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    out.push(d);
  }
  return out;
}

function getSlotState(courtRows, date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const slotStart = new Date(date);
  slotStart.setHours(h, m, 0, 0);
  const slotEnd = new Date(slotStart.getTime() + 90 * 60_000);
  const occupied = courtRows.some((row) => {
    if (!row.start_at || !row.end_at) return false;
    const rStart = parseUtcDate(row.start_at);
    const rEnd = parseUtcDate(row.end_at);
    return rStart < slotEnd && rEnd > slotStart;
  });
  return {
    startAt: slotStart.toISOString(),
    endAt: slotEnd.toISOString(),
    occupied
  };
}

function buildAvailableSlots(courtRows, date) {
  return slots
    .map((slot) => ({ slot, ...getSlotState(courtRows, date, slot) }))
    .filter((item) => !item.occupied);
}

export default function ReservarPage() {
  const router = useRouter();
  const feedback = useFeedback();
  const days = useMemo(buildDates, []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [sport, setSport] = useState("PADEL");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const selectedDayYmd = useMemo(() => localYmd(selectedDay), [selectedDay]);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/availability?clubId=1&sport=${sport}&day=${selectedDayYmd}`, {
        cache: "no-store"
      });
      const data = await response.json();
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
  }, [selectedDayYmd, sport, refreshTick]);

  useEffect(() => {
    setSelected(null);
  }, [selectedDayYmd, sport]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    function requestRefresh() {
      setRefreshTick((v) => v + 1);
    }

    window.addEventListener("focus", requestRefresh);
    window.addEventListener("pageshow", requestRefresh);
    window.addEventListener("popstate", requestRefresh);

    return () => {
      window.removeEventListener("focus", requestRefresh);
      window.removeEventListener("pageshow", requestRefresh);
      window.removeEventListener("popstate", requestRefresh);
    };
  }, []);

  const courts = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.court_id)) {
        map.set(row.court_id, {
          id: row.court_id,
          name: row.court_name,
          sport: row.sport,
          price: Number(row.price_per_hour || 0),
          rows: []
        });
      }
      map.get(row.court_id).rows.push(row);
    }
    return [...map.values()]
      .map((court) => ({
        ...court,
        availableSlots: buildAvailableSlots(court.rows, selectedDay)
      }))
      .filter((court) => court.availableSlots.length > 0);
  }, [rows, selectedDay]);

  async function onContinue() {
    if (!selected) return;
    try {
      const payload = {
        club_id: 1,
        court_id: selected.courtId,
        start_at: selected.startAt,
        end_at: selected.endAt,
        duration_min: 90,
        total_amount: selected.price,
        customer_name: "",
        customer_phone: "",
        customer_email: ""
      };
      const response = await fetch("/api/public/reservations/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No disponible",
            fallbackSolution: "Elegí otro horario y volvé a intentar."
          }),
          code: "HOLD_CREATE_ERROR"
        });
        return;
      }
      router.push(`/checkout/${data.reservation.booking_code}?token=${encodeURIComponent(data.manageToken)}`);
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "No se pudo conectar con el servidor.",
          fallbackSolution: "Revisá tu conexión y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    }
  }

  return (
    <div className="reservation-page">
      <section className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="btn btn-outline-primary btn-icon" aria-label="Volver al inicio">
            ←
          </button>
          <h1 className="text-xl font-black">Reservar Cancha</h1>
          <span className="inline-block w-9" aria-hidden="true" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => {
            const active = day.toDateString() === selectedDay.toDateString();
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`btn btn-sm min-w-20 rounded-2xl border px-3 py-2 text-center btn-chip ${active ? "is-active" : ""}`}
              >
                <p className="text-xs font-bold uppercase">{day.toLocaleDateString("es-AR", { weekday: "short" })}</p>
                <p className="text-3xl font-black leading-none">{day.getDate()}</p>
              </button>
            );
          })}
        </div>

        <div className="filter-track grid grid-cols-3 gap-2 rounded-2xl p-1">
          {sports.map((item) => (
            <button
              key={item.key}
              onClick={() => setSport(item.key)}
              className={`btn btn-sm rounded-xl px-3 py-2 text-sm font-bold btn-chip ${sport === item.key ? "is-active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-sm text-muted">Cargando disponibilidad...</p> : null}
        <div className="space-y-6">
          {courts.map((court) => (
            <div key={court.id} className="surface-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black">{court.name}</h3>
                  <p className="text-sm text-muted">{court.sport}</p>
                </div>
                <span className="status-badge status-badge--available">{court.availableSlots.length} DISPONIBLES</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {court.availableSlots.map((state) => {
                  const isSelected = selected?.courtId === court.id && selected?.slot === state.slot;
                  return (
                    <button
                      key={state.slot}
                      onClick={() => setSelected({ courtId: court.id, slot: state.slot, startAt: state.startAt, endAt: state.endAt, price: court.price })}
                      className={`slot-btn rounded-xl border px-2 py-2 ${isSelected ? "slot-btn--selected" : ""}`}
                    >
                      <p className="text-lg font-black leading-tight">{state.slot}</p>
                      <p className="text-xs">${court.price.toFixed(2)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!loading && courts.length === 0 ? (
            <div className="surface-card p-4 text-sm text-muted">No hay horarios disponibles para este día/deporte.</div>
          ) : null}
        </div>
      </section>

      <div className="reservation-summary-bar">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <div className="flex-1">
            <p className="text-xs text-muted">Total (1 sesión)</p>
            <p className="text-4xl font-black">${selected ? selected.price.toFixed(2) : "0.00"}</p>
          </div>
          <Button className="min-w-44" onClick={onContinue} disabled={!selected}>
            Continuar →
          </Button>
        </div>
      </div>
    </div>
  );
}
