"use client";

import { useEffect, useState } from "react";
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
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const feedback = useFeedback();

  async function load() {
    const response = await fetch("/api/admin/canchas");
    const data = await response.json();
    setRows(data.rows || []);
  }

  async function create() {
    setSaving(true);
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
      setShowCreate(false);
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
    } finally {
      setSaving(false);
    }
  }

  async function update() {
    if (!editingId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/canchas/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sport: form.sport,
          image_url: form.image_url,
          surface: form.surface,
          location_type: form.location_type,
          status: form.status,
          price_per_hour: form.price_per_hour,
          min_duration_min: form.min_duration_min
        })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo actualizar la cancha.",
            fallbackSolution: "Revisá los datos y volvé a intentar."
          }),
          code: "ADMIN_COURT_UPDATE_ERROR"
        });
        return;
      }
      setForm(defaultForm);
      setEditingId(null);
      setShowCreate(false);
      await load();
      feedback.showSuccess({
        title: "Cancha actualizada",
        message: "Los datos de la cancha se guardaron correctamente.",
        solution: "La lista ya refleja los cambios."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al actualizar cancha.",
          fallbackSolution: "Revisá internet y reintentá."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeCourt(id) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/canchas/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudo eliminar la cancha.",
            fallbackSolution: "Verificá dependencias de reservas y reintentá."
          }),
          code: "ADMIN_COURT_DELETE_ERROR"
        });
        return;
      }
      if (editingId === id) {
        setEditingId(null);
        setForm(defaultForm);
        setShowCreate(false);
      }
      await load();
      feedback.showSuccess({
        title: "Cancha eliminada",
        message: "La cancha se eliminó correctamente.",
        solution: "La lista de canchas se actualizó."
      });
      setPendingDelete(null);
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al eliminar cancha.",
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
    setForm(defaultForm);
    setShowCreate((v) => !v);
  }

  function onStartEdit(row) {
    setForm({
      club_id: Number(row.club_id) || 1,
      name: row.name || "",
      sport: row.sport || "PADEL",
      image_url: row.image_url || "",
      surface: row.surface || "",
      location_type: row.location_type || "",
      status: row.status || "ACTIVE",
      price_per_hour: Number(row.price_per_hour || 0),
      min_duration_min: Number(row.min_duration_min || 60)
    });
    setEditingId(row.id);
    setShowCreate(true);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="admin-page-content">
      <section className="space-y-4 py-4">
        <div className="surface-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Canchas y Precios</h1>
              <p className="text-sm text-muted">Gestión de datos, tarifas y estado de las canchas.</p>
            </div>
            <Button onClick={onStartCreate} className="w-full sm:w-auto">
              {showCreate ? "Cerrar" : "+ Nueva cancha"}
            </Button>
          </div>
        </div>

        {showCreate ? (
          <div className="rounded-3xl border border-line bg-white p-4">
            <h3 className="mb-2 text-xl font-black">{editingId ? "Editar Cancha" : "Nueva Cancha"}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Nombre</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Deporte</span>
                <select className="w-full rounded-xl border border-line px-3 py-2" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                  <option value="PADEL">Padel</option>
                  <option value="FUTBOL">Fútbol</option>
                  <option value="TENIS">Tenis</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted">Imagen URL</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Ej: /ui-screens/canchaalquilada.jpg" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Superficie</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Ej: CRISTAL" value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Ubicación</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Ej: INTERIOR" value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Precio por hora</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" type="number" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: Number(e.target.value) })} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Duración mínima (min)</span>
                <input className="w-full rounded-xl border border-line px-3 py-2" type="number" value={form.min_duration_min} onChange={(e) => setForm({ ...form, min_duration_min: Number(e.target.value) })} />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted">Estado</span>
                <select className="w-full rounded-xl border border-line px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVA</option>
                  <option value="MAINTENANCE">MANTENIMIENTO</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-[#F8F9FC] p-2.5">
              <img
                src={form.image_url || "/ui-screens/02-reservar-pista.png"}
                alt="Vista previa cancha"
                className="h-16 w-24 rounded-lg object-cover"
              />
              <div>
                <p className="text-xs font-bold text-muted">Vista previa</p>
                <p className="text-sm font-semibold">{form.name || "Nombre de cancha"}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" onClick={editingId ? update : create} disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar cancha"}
              </Button>
              {editingId ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setEditingId(null);
                    setForm(defaultForm);
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
                <img
                  src={row.image_url || "/ui-screens/02-reservar-pista.png"}
                  alt={row.name}
                  className="h-16 w-20 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-xl font-black leading-tight">{row.name}</h4>
                  <p className="text-[11px] font-bold uppercase leading-tight text-muted">{row.surface} / {row.location_type}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs leading-tight">
                    <p><span className="text-muted">Precio:</span> ${Number(row.price_per_hour).toFixed(2)}</p>
                    <p><span className="text-muted">Duración:</span> {row.min_duration_min} min</p>
                  </div>
                  <span
                    className={`status-badge mt-2 ${
                      row.status === "ACTIVE"
                        ? "status-badge--available"
                        : row.status === "MAINTENANCE"
                          ? "status-badge--maintenance"
                          : "status-badge--inactive"
                    }`}
                  >
                    {row.status === "ACTIVE" ? "ACTIVA" : row.status === "MAINTENANCE" ? "MANTENIMIENTO" : "INACTIVA"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <button type="button" className="text-2xl leading-none" aria-label="Editar cancha" onClick={() => onStartEdit(row)}>✎</button>
                  <button
                    type="button"
                    className="text-2xl leading-none"
                    aria-label="Eliminar cancha"
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
            <h3 className="text-2xl font-black">¿Eliminar cancha?</h3>
            <p className="mt-2 text-sm">
              Vas a eliminar <span className="font-bold">{pendingDelete.name}</span>. Esta acción impacta directamente en la base de datos.
            </p>
            <p className="mt-2 text-xs text-muted">
              Si la cancha tiene reservas asociadas, el sistema bloqueará el borrado para proteger integridad.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" className="w-full" onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => removeCourt(pendingDelete.id)}
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
