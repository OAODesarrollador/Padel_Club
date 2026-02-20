"use client";

import { useEffect, useState } from "react";
import { BottomNav, TopBar } from "@/components/ui/AppScaffold";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

const initial = {
  club_id: 1,
  title: "",
  description: "",
  sport: "PADEL",
  starts_at: "",
  spots_left: 8,
  status: "PUBLISHED",
  image_url: "/ui-screens/08-eventos.png"
};

export default function AdminEventosPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initial);
  const feedback = useFeedback();

  async function load() {
    const res = await fetch("/api/admin/eventos");
    const data = await res.json();
    setRows(data.rows || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    try {
      const response = await fetch("/api/admin/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, starts_at: new Date(form.starts_at).toISOString() })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo crear el evento.",
            fallbackSolution: "Revisá fecha, cupos y permisos de administrador."
          }),
          code: "ADMIN_EVENT_CREATE_ERROR"
        });
        return;
      }
      setForm(initial);
      load();
      feedback.showSuccess({
        title: "Evento creado",
        message: "El evento fue registrado correctamente.",
        solution: "Ya aparece en el listado y en público si está publicado."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al crear evento.",
          fallbackSolution: "Revisá internet y volvé a intentar."
        }),
        code: "NETWORK_ERROR"
      });
    }
  }

  return (
    <div className="pb-24">
      <TopBar title="Eventos" />
      <section className="space-y-4 p-4">
        <div className="rounded-3xl border border-line bg-white p-4">
          <h3 className="mb-2 text-xl font-black">Nuevo evento</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            <select className="rounded-xl border border-line px-3 py-2" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
              <option value="PADEL">Padel</option>
              <option value="FUTBOL">Fútbol</option>
              <option value="TENIS">Tenis</option>
            </select>
            <input className="rounded-xl border border-line px-3 py-2" type="number" value={form.spots_left} onChange={(e) => setForm({ ...form, spots_left: Number(e.target.value) })} />
          </div>
          <Button className="mt-3 w-full" onClick={create}>Crear evento</Button>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-line bg-white p-3">
              <p className="text-2xl font-black">{row.title}</p>
              <p className="text-sm text-muted">{new Date(row.starts_at).toLocaleString("es-AR")}</p>
            </article>
          ))}
        </div>
      </section>
      <BottomNav
        items={[
          { href: "/admin/reservas", label: "Reservas", icon: "📅" },
          { href: "/admin/canchas", label: "Canchas", icon: "🎾" },
          { href: "/admin/eventos", label: "Eventos", icon: "🏆", active: true },
          { href: "/admin/ajustes", label: "Ajustes", icon: "⚙️" }
        ]}
      />
    </div>
  );
}
