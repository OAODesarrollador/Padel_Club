import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/AppScaffold";
import { Button } from "@/components/ui/Button";
import { listCourts } from "@/lib/sql/courts";

export default async function HomePage() {
  const courts = await listCourts(1);

  return (
    <div className="home-page-dark pb-24">
      <section className="relative min-h-[320px] overflow-hidden">
        <Image src="/images/imagencancha.jpg" alt="Cancha principal" fill className="object-cover object-center opacity-65" />
        <div className="absolute inset-0 bg-black/18" />
        <div className="relative px-4 pb-8 pt-20">
          <p className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Club Deportivo</p>
          <h1 className="mb-2 text-4xl font-black leading-tight text-white">Tu cancha te espera.</h1>
          <p className="mb-4 text-sm text-white/90">Reservá tu cancha deportiva de fútbol, pádel, fútbol o tenis en segundos en nuestra app.</p>
          <Link href="/reservar">
            <Button className="home-cta-btn">Reservar ahora</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4 px-4 pt-5">
        <h2 className="section-title-dark text-xl font-black">Cómo funciona</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Reserva fecha y hora disponible",
            "Confirmación tu reserva al instante",
            "Pago seguro y fácil",
            "Recibí Notificación con los detalles de tu reserva",
          ].map((item, idx) => (
            <Card key={item} className="p-2.5">
              <div className="grid grid-cols-[48px_1fr] items-center gap-2">
                <p className="text-3xl font-black leading-none text-brand">{String(idx + 1).padStart(2, "0")}</p>
                <p className="text-sm font-bold leading-snug">{item}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title-dark text-xl font-black">Nuestras canchas</h2>
        </div>

        <div className="space-y-3">
          {courts.map((court, idx) => (
            <Card key={court.id}>
              <div className="grid gap-3 md:grid-cols-2 md:items-center">
                <div className={`relative h-32 overflow-hidden rounded-2xl ${idx % 2 === 1 ? "md:order-2" : ""}`}>
                  <Image
                    src={court.image_url || "/ui-screens/02-reservar-pista.png"}
                    alt={court.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className={idx % 2 === 1 ? "md:order-1" : ""}>
                  <h3 className="mb-1 text-lg font-black">{court.name}</h3>
                  <p className="text-sm leading-6 text-muted">
                    {court.sport} • {court.surface} • {court.location_type} • ${Number(court.price_per_hour).toFixed(2)}/hora
                  </p>
                </div>
              </div>
            </Card>
          ))}
          {courts.length === 0 ? <Card className="text-sm text-muted">Todavía no hay canchas cargadas.</Card> : null}
        </div>
      </section>
    </div>
  );
}
