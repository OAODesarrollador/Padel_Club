"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNav, TopBar } from "@/components/ui/AppScaffold";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

const defaultForm = {
  club_id: 1,
  name: "",
  sport: "PADEL",
  image_url: "",
  surface: "CRISTAL",
  location_type: "INTERIOR",
  status: "ACTIVE",
  price_per_hour: 25,
  min_duration_min: 90
};

export default function AdminCanchasPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const feedback = useFeedback();

  async function load() {
    const response = await fetch("/api/admin/canchas");
    const data = await response.json();
    setRows(data.rows || []);
  }

  async function create() {
    try {
      const response = await fetch("/api/admin/canchas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo crear la cancha.",
            fallbackSolution: "Verificá permisos de ADMIN y datos obligatorios."
          }),
          code: "ADMIN_COURT_CREATE_ERROR"
        });
        return;
      }
      setForm(defaultForm);
      load();
      feedback.showSuccess({
        title: "Cancha creada",
        message: "La cancha se guardó correctamente.",
        solution: "Podés editar precio y estado desde el listado."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al crear cancha.",
          fallbackSolution: "Revisá internet y volvé a intentar."
        }),
        code: "NETWORK_ERROR"
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="pb-24">
      <TopBar title="Canchas y Precios" left={<Link href="/admin/reservas">←</Link>} right={<span>⚙️</span>} />
      <section className="space-y-4 p-4">
        <div className="rounded-3xl border border-line bg-white p-4">
          <h3 className="mb-2 text-xl font-black">Nueva Cancha</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="rounded-xl border border-line px-3 py-2" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
              <option value="PADEL">Padel</option>
              <option value="FUTBOL">Fútbol</option>
              <option value="TENIS">Tenis</option>
            </select>
            <input className="rounded-xl border border-line px-3 py-2 sm:col-span-2" placeholder="Imagen URL (ej: /ui-screens/canchaalquilada.jpg)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" type="number" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: Number(e.target.value) })} />
            <input className="rounded-xl border border-line px-3 py-2" type="number" value={form.min_duration_min} onChange={(e) => setForm({ ...form, min_duration_min: Number(e.target.value) })} />
          </div>
          <Button className="mt-3 w-full" onClick={create}>+ Nueva cancha</Button>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-3xl border border-line bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-2xl font-black">{row.name}</h4>
                  <p className="text-xs font-bold uppercase text-muted">{row.surface} / {row.location_type}</p>
                </div>
                <div className="text-muted">✎ 🗑</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted">Precio/hora:</span> ${Number(row.price_per_hour).toFixed(2)}</p>
                <p><span className="text-muted">Duración:</span> {row.min_duration_min} min</p>
                <p className="col-span-2"><span className="text-muted">Imagen:</span> {row.image_url || "-"}</p>
              </div>
              <div className="mt-3 inline-flex rounded-full bg-[#E4FEEB] px-3 py-1 text-xs font-black text-[#1CB250]">
                {row.status === "ACTIVE" ? "ACTIVA" : "MANTENIMIENTO"}
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNav
        items={[
          { href: "/admin/reservas", label: "Reservas", icon: "📅" },
          { href: "/admin/canchas", label: "Canchas", icon: "🎾", active: true },
          { href: "/admin/eventos", label: "Eventos", icon: "🏆" },
          { href: "/admin/ajustes", label: "Ajustes", icon: "⚙️" }
        ]}
      />
    </div>
  );
}
