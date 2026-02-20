import Image from "next/image";
import { listPublicEvents } from "@/lib/sql/events";
import { Button } from "@/components/ui/Button";

export default async function EventosPage() {
  const events = await listPublicEvents(1);
  const fallback = [
    { id: 1, sport: "PADEL", title: "Open de Pádel del Sábado", starts_at: new Date().toISOString(), spots_left: 4, image_url: "/ui-screens/08-eventos.png", status: "ABIERTO" },
    { id: 2, sport: "FUTBOL", title: "Partido 5v5 del Lunes", starts_at: new Date().toISOString(), spots_left: 8, image_url: "/ui-screens/08-eventos.png", status: "ABIERTO" },
    { id: 3, sport: "TENIS", title: "Clínica Junior de Tenis", starts_at: new Date().toISOString(), spots_left: 0, image_url: "/ui-screens/08-eventos.png", status: "COMPLETO" }
  ];
  const rows = events.length ? events : fallback;

  return (
    <div className="pb-24">
      <header className="border-b border-line bg-white px-4 py-4">
        <h1 className="text-3xl font-black">Eventos del Club</h1>
      </header>
      <section className="space-y-4 p-4">
        {rows.map((event) => (
          <article key={event.id} className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="relative h-44">
              <Image src={event.image_url || "/ui-screens/08-eventos.png"} alt={event.title} fill className="object-cover" />
            </div>
            <div className="space-y-2 p-4">
              <p className="inline-flex rounded-md bg-[#0F172A] px-2 py-1 text-[10px] font-black text-white">{event.sport}</p>
              <h2 className="text-3xl font-black">{event.title}</h2>
              <p className="text-sm text-muted">{new Date(event.starts_at).toLocaleString("es-AR")}</p>
              <Button className="w-full" variant={event.spots_left > 0 ? "primary" : "secondary"}>
                {event.spots_left > 0 ? "Inscribirme" : "Lista de espera"}
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
