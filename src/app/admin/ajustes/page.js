"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

const initial = {
  name: "",
  phone: "",
  email: "",
  address: "",
  timezone: "UTC",
  transfer_alias: "",
  transfer_cbu: "",
  transfer_holder: "",
  transfer_bank: "",
  hold_minutes: 7,
  cancel_hours_before: 2,
  reschedule_limit: 1
};

export default function AdminAjustesPage() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const feedback = useFeedback();

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ajustes");
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudieron cargar los ajustes.",
            fallbackSolution: "Verificá permisos de administrador e intentá de nuevo."
          }),
          code: "ADMIN_SETTINGS_LOAD_ERROR"
        });
        return;
      }
      setForm({
        ...initial,
        ...data.settings,
        hold_minutes: Number(data.settings?.hold_minutes ?? 7),
        cancel_hours_before: Number(data.settings?.cancel_hours_before ?? 2),
        reschedule_limit: Number(data.settings?.reschedule_limit ?? 1)
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al cargar ajustes.",
          fallbackSolution: "Revisá internet y volvé a intentar."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ajustes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "No se pudieron guardar los ajustes.",
            fallbackSolution: "Revisá los campos requeridos e intentá nuevamente."
          }),
          code: "ADMIN_SETTINGS_SAVE_ERROR"
        });
        return;
      }
      setForm({
        ...form,
        ...data.settings
      });
      feedback.showSuccess({
        title: "Ajustes actualizados",
        message: "Los cambios del club se guardaron correctamente.",
        solution: "Ya están disponibles para el sistema de reservas y pagos."
      });
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "Error de conexión al guardar ajustes.",
          fallbackSolution: "Revisá internet y volvé a intentar."
        }),
        code: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="admin-page-content">
      <section className="space-y-4 py-4">
        <div className="surface-card p-4">
          <h1 className="text-2xl font-black sm:text-3xl">Ajustes</h1>
          <p className="text-sm text-muted">Configuración general del club, transferencias y reglas operativas.</p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-4">
          <h2 className="mb-3 text-2xl font-black">Datos del Club</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Nombre del club" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Zona horaria (ej: UTC)" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2 sm:col-span-2" placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-4">
          <h2 className="mb-3 text-2xl font-black">Datos de Transferencia</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Alias" value={form.transfer_alias} onChange={(e) => setForm({ ...form, transfer_alias: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" placeholder="CBU" value={form.transfer_cbu} onChange={(e) => setForm({ ...form, transfer_cbu: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Titular" value={form.transfer_holder} onChange={(e) => setForm({ ...form, transfer_holder: e.target.value })} />
            <input className="rounded-xl border border-line px-3 py-2" placeholder="Banco" value={form.transfer_bank} onChange={(e) => setForm({ ...form, transfer_bank: e.target.value })} />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-4">
          <h2 className="mb-3 text-2xl font-black">Reglas</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted">Hold (minutos)</span>
              <input className="w-full rounded-xl border border-line px-3 py-2" type="number" min={1} max={60} value={form.hold_minutes} onChange={(e) => setForm({ ...form, hold_minutes: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Cancelar hasta (horas)</span>
              <input className="w-full rounded-xl border border-line px-3 py-2" type="number" min={0} max={168} value={form.cancel_hours_before} onChange={(e) => setForm({ ...form, cancel_hours_before: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Límite reprogramación</span>
              <input className="w-full rounded-xl border border-line px-3 py-2" type="number" min={0} max={10} value={form.reschedule_limit} onChange={(e) => setForm({ ...form, reschedule_limit: Number(e.target.value) })} />
            </label>
          </div>
        </div>

        <Button className="w-full sm:w-auto" onClick={save} disabled={loading}>
          {loading ? "Guardando..." : "Guardar ajustes"}
        </Button>
      </section>
    </div>
  );
}
