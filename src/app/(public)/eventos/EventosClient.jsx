"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { formatInClubTimeZone } from "@/lib/datetime";

export default function EventosClient({ rows }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="space-y-4 p-4">
      {rows.map((event, index) => {
        const isOpen = openId === event.id;
        const imageFirst = index % 2 === 0;
        return (
          <article key={event.id} className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className={`relative flex min-h-52 items-center justify-center bg-[#F8F9FC] p-2 ${imageFirst ? "md:order-1" : "md:order-2"}`}>
                <Image
                  src={event.image_url || "/ui-screens/08-eventos.png"}
                  alt={event.title}
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div className={`space-y-2 p-4 ${imageFirst ? "md:order-2" : "md:order-1"}`}>
                <p className="inline-flex rounded-md bg-[#0F172A] px-2 py-1 text-[10px] font-black text-white">{event.sport}</p>
                <h2 className="text-2xl font-black">{event.title}</h2>
                <p className="text-sm text-muted">{formatInClubTimeZone(event.starts_at, { dateStyle: "short", timeStyle: "short" })}</p>
                <p className="text-sm text-muted">Cupos disponibles: {Number(event.spots_left || 0)}</p>

                {isOpen ? (
                  <div className="space-y-3 pt-1">
                    <p className="text-sm text-muted">{event.description || "Sin descripción disponible para este evento."}</p>
                    <p className="text-sm text-muted">Estado: {event.status || "PUBLISHED"}</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button className="w-full" variant={event.spots_left > 0 ? "primary" : "secondary"}>
                        {event.spots_left > 0 ? "Inscribirme" : "Lista de espera"}
                      </Button>
                      <Button className="w-full" variant="ghost" onClick={() => setOpenId(null)}>
                        Cerrar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full sm:w-auto" variant="ghost" onClick={() => setOpenId(event.id)}>
                    Saber más
                  </Button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
