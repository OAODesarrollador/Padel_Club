import Image from "next/image";
import { Card } from "@/components/ui/AppScaffold";

export default function NosotrosPage() {
  return (
    <div className="pb-24">
      <section className="space-y-4 px-4">
        <h1 className="text-5xl font-black">Nosotros</h1>
        <p className="text-sm text-muted">Conoce el corazón de tu club deportivo favorito.</p>

        <Card>
          <h2 className="mb-2 text-xl font-black">Nuestra Historia</h2>
          <p className="text-sm leading-6 text-muted">
            Fundado con la pasión de unir a la comunidad a través del deporte, Club Deportivo nació como un sueño de amigos.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-black">Galería</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative col-span-1 h-36 overflow-hidden rounded-2xl">
              <Image src="/ui-screens/01-home.png" alt="Galería 1" fill className="object-cover" />
            </div>
            <div className="relative col-span-1 h-36 overflow-hidden rounded-2xl">
              <Image src="/ui-screens/08-eventos.png" alt="Galería 2" fill className="object-cover" />
            </div>
            <div className="relative col-span-2 h-36 overflow-hidden rounded-2xl">
              <Image src="/ui-screens/07-nosotros.png" alt="Galería 3" fill className="object-cover" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 text-xl font-black">Horarios</h2>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between"><span className="text-muted">Lunes a Viernes</span><span className="font-bold">07:00 - 23:00</span></p>
            <p className="flex justify-between"><span className="text-muted">Sábados</span><span className="font-bold">08:00 - 22:00</span></p>
            <p className="flex justify-between"><span className="text-muted">Domingos</span><span className="font-bold">08:00 - 20:00</span></p>
          </div>
        </Card>
      </section>
    </div>
  );
}
