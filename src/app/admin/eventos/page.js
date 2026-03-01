"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

const initial = {
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
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
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
    setSaving(true);
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
      setShowCreate(false);
      await load();
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
    } finally {
      setSaving(false);
    }
  }

  async function update() {
    if (!editingId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/eventos/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          sport: form.sport,
          starts_at: new Date(form.starts_at).toISOString(),
          spots_left: form.spots_left,
          status: form.status,
          image_url: form.image_url
        })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo actualizar el evento.",
            fallbackSolution: "Revisá los datos y volvé a intentar."
          }),
          code: "ADMIN_EVENT_UPDATE_ERROR"
        });
        return;
      }
      setForm(initial);
      setEditingId(null);
      setShowCreate(false);
      await load();
      feedback.showSuccess({
        title: "Evento actualizado",
        message: "Los cambios del evento se guardaron correctamente.",
        solution: "La lista de eventos se actualizó."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al actualizar evento.",
          fallbackSolution: "Revisá internet y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(id) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/eventos/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo eliminar el evento.",
            fallbackSolution: "Reintentá en unos segundos."
          }),
          code: "ADMIN_EVENT_DELETE_ERROR"
        });
        return;
      }
      if (editingId === id) {
        setEditingId(null);
        setForm(initial);
        setShowCreate(false);
      }
      setPendingDelete(null);
      await load();
      feedback.showSuccess({
        title: "Evento eliminado",
        message: "El evento se eliminó correctamente.",
        solution: "La lista ya refleja el cambio."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al eliminar evento.",
          fallbackSolution: "Revisá internet y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setDeletingId(null);
    }
  }

  function onStartCreate() {
    setEditingId(null);
    setForm(initial);
    setShowCreate((v) => !v);
  }

  function onStartEdit(row) {
    setForm({
      title: row.title || "",
      description: row.description || "",
      sport: row.sport || "PADEL",
      starts_at: row.starts_at ? new Date(row.starts_at).toISOString().slice(0, 16) : "",
      spots_left: Number(row.spots_left || 0),
      status: row.status || "PUBLISHED",
      image_url: row.image_url || "/ui-screens/08-eventos.png"
    });
    setEditingId(row.id);
    setShowCreate(true);
  }

  return (
    <div className="admin-page-content">
      <section className="space-y-4 py-4">
        <div className="surface-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Eventos</h1>
              <p className="text-sm text-muted">Alta y gestión de eventos con imagen.</p>
            </div>
            <Button onClick={onStartCreate} className="w-full sm:w-auto">
              {showCreate ? "Cerrar" : "+ Nuevo evento"}
            </Button>
          </div>
        </div>

        {showCreate ? (
          <div className="rounded-3xl border border-line bg-white p-4">
            <h3 className="mb-2 text-xl font-black">{editingId ? "Editar evento" : "Nuevo evento"}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Título</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Fecha y hora</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Deporte</span>
                <select className="w-full rounded-xl border border-line px-3 py-2" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                  <option value="PADEL">Padel</option>
                  <option value="FUTBOL">Fútbol</option>
                  <option value="TENIS">Tenis</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Cupos</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" type="number" value={form.spots_left} onChange={(e) => setForm({ ...form, spots_left: Number(e.target.value) })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Estado</span>
                <select className="w-full rounded-xl border border-line px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="PUBLISHED">PUBLICADO</option>
                  <option value="DRAFT">BORRADOR</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Imagen URL</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Ej: /ui-screens/08-eventos.png" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted">Descripción</span>
                <textarea className="w-full rounded-xl border border-line px-3 py-2" rows={3} placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-line bg-[#F8F9FC] p-2.5">
                <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-white p-1 sm:h-24 sm:w-36">
                  <img src={form.image_url || "/ui-screens/08-eventos.png"} alt="Vista previa evento" className="h-full w-full rounded object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted">Vista previa</p>
                  <p className="text-sm font-semibold">{form.title || "Título del evento"}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" onClick={editingId ? update : create} disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar evento"}
              </Button>
              {editingId ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initial);
                    setShowCreate(false);
                  }}
                >
                  Cancelar edición
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-line bg-white p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FC] p-1 sm:h-24 sm:w-36">
                  <img src={row.image_url || "/ui-screens/08-eventos.png"} alt={row.title} className="h-full w-full rounded object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl font-black leading-tight">{row.title}</p>
                  <p className="text-xs text-muted">{new Date(row.starts_at).toLocaleString("es-AR")}</p>
                  <p className={`mt-2 inline-flex status-badge ${row.status === "PUBLISHED" ? "status-badge--confirmed" : "status-badge--pending"}`}>
                    {row.status === "PUBLISHED" ? "PUBLICADO" : "BORRADOR"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <button type="button" className="text-2xl leading-none" aria-label="Editar evento" onClick={() => onStartEdit(row)}>✎</button>
                  <button
                    type="button"
                    className="text-2xl leading-none"
                    aria-label="Eliminar evento"
                    onClick={() => setPendingDelete(row)}
                    disabled={deletingId === row.id}
                  >
                    {deletingId === row.id ? "…" : "🗑"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 grid place-content-center bg-black/45 px-4 py-6">
          <div className="surface-card w-full max-w-md max-h-[88vh] overflow-y-auto p-5">
            <p className="status-badge status-badge--pending mb-2">Confirmación requerida</p>
            <h3 className="text-2xl font-black">¿Eliminar evento?</h3>
            <p className="mt-2 text-sm">
              Vas a eliminar <span className="font-bold">{pendingDelete.title}</span>.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" className="w-full" onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => removeEvent(pendingDelete.id)}
                disabled={deletingId === pendingDelete.id}
              >
                {deletingId === pendingDelete.id ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
