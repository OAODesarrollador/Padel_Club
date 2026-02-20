"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav, TopBar } from "@/components/ui/AppScaffold";

export default function AdminReservasPage() {
  const [rows, setRows] = useState([]);
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const url = new URL("/api/admin/reservas", window.location.origin);
    if (sport) url.searchParams.set("sport", sport);
    if (status) url.searchParams.set("status", status);
    const response = await fetch(url);
    const data = await response.json();
    setRows(data.rows || []);
  }

  useEffect(() => {
    load();
  }, [sport, status]);

  const kpis = useMemo(() => {
    const pending = rows.filter((r) => r.payment_status && r.payment_status.includes("PENDING")).length;
    const confirmed = rows.filter((r) => r.status === "CONFIRMED").length;
    return { count: rows.length, pending, occupancy: rows.length ? Math.min(99, 50 + rows.length) : 0, confirmed };
  }, [rows]);

  return (
    <div className="pb-24">
      <TopBar title="Reservas" left={<span className="text-xl">☰</span>} right={<span className="text-xl">👤</span>} />
      <section className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">HOY</p>
            <p className="text-4xl font-black">{new Date().getDate()}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">PENDIENTES</p>
            <p className="text-4xl font-black">{kpis.pending}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-xs font-bold text-muted">OCUPACIÓN</p>
            <p className="text-4xl font-black text-primary">{kpis.occupancy}%</p>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Filtros</h3>
        <div className="flex flex-wrap gap-2">
          {["", "PADEL", "FUTBOL", "TENIS"].map((s) => (
            <button key={s || "all"} onClick={() => setSport(s)} className={`btn btn-sm rounded-full border px-4 py-2 text-sm font-bold btn-chip ${sport === s ? "is-active" : ""}`}>
              {s || "Hoy"}
            </button>
          ))}
          <button onClick={() => setStatus(status ? "" : "CONFIRMED")} className="btn btn-sm rounded-full border px-4 py-2 text-sm font-bold btn-chip">
            {status ? "Limpiar" : "Solo confirmadas"}
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black">Listado de Reservas</h2>
          {rows.map((row) => (
            <article key={row.id} className="surface-card p-3">
              <div className="flex items-center justify-between">
                <div className="time-chip min-w-16 rounded-xl p-2 text-center text-xs font-black text-muted">
                  <p>{new Date(row.start_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex-1 px-3">
                  <p className="text-2xl font-black">{row.customer_name || "Sin nombre"}</p>
                  <p className="text-xs text-muted">{row.court_name}</p>
                  <p className={`status-badge ${
                    row.status === "CONFIRMED"
                      ? "status-badge--confirmed"
                      : row.status === "CANCELED"
                        ? "status-badge--canceled"
                        : row.payment_status?.includes("PENDING")
                          ? "status-badge--pending"
                          : "status-badge--info"
                  }`}>{row.status}</p>
                </div>
                <button className="btn btn-outline-primary btn-sm">✎</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Link href="/admin/reservas" className="btn btn-success btn-cta fixed bottom-24 right-5 grid h-16 w-16 place-content-center rounded-full text-4xl font-black shadow-soft">+</Link>
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
