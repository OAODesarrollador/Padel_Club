import { listPublicEvents } from "@/lib/sql/events";
import EventosClient from "./EventosClient";

export default async function EventosPage() {
  const events = await listPublicEvents(1);
  const fallback = [
    {
      id: 1,
      sport: "PADEL",
      title: "Open de Pádel del Sábado",
      description: "Torneo abierto por categorías con premios y cierre social.",
      starts_at: new Date().toISOString(),
      spots_left: 4,
      image_url: "/ui-screens/08-eventos.png",
      status: "ABIERTO"
    },
    {
      id: 2,
      sport: "FUTBOL",
      title: "Partido 5v5 del Lunes",
      description: "Partido recreativo con inscripción por equipo o individual.",
      starts_at: new Date().toISOString(),
      spots_left: 8,
      image_url: "/ui-screens/08-eventos.png",
      status: "ABIERTO"
    },
    {
      id: 3,
      sport: "TENIS",
      title: "Clínica Junior de Tenis",
      description: "Jornada técnica para categorías junior con cupos limitados.",
      starts_at: new Date().toISOString(),
      spots_left: 0,
      image_url: "/ui-screens/08-eventos.png",
      status: "COMPLETO"
    }
  ];
  const rows = events.length ? events : fallback;

  return (
    <div className="pb-24">
      <header className="border-b border-line bg-white px-4 py-4">
        <h1 className="text-3xl font-black">Eventos del Club</h1>
      </header>
      <EventosClient rows={rows} />
    </div>
  );
}
