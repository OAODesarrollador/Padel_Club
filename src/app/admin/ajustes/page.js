import { BottomNav, TopBar } from "@/components/ui/AppScaffold";

export default function AdminAjustesPage() {
  return (
    <div className="pb-24">
      <TopBar title="Ajustes" />
      <section className="space-y-4 p-4">
        <div className="rounded-3xl border border-line bg-white p-4">
          <h2 className="text-2xl font-black">Datos del club</h2>
          <p className="text-sm text-muted">Configura reglas, horarios, y datos de transferencia del club.</p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-4">
          <h2 className="text-2xl font-black">Reglas</h2>
          <ul className="list-disc pl-5 text-sm text-muted">
            <li>Hold de 7 minutos.</li>
            <li>Cancelar hasta 2 horas antes.</li>
            <li>Reprogramar una vez por reserva.</li>
          </ul>
        </div>
      </section>
      <BottomNav
        items={[
          { href: "/admin/reservas", label: "Reservas", icon: "📅" },
          { href: "/admin/canchas", label: "Canchas", icon: "🎾" },
          { href: "/admin/eventos", label: "Eventos", icon: "🏆" },
          { href: "/admin/ajustes", label: "Ajustes", icon: "⚙️", active: true }
        ]}
      />
    </div>
  );
}
