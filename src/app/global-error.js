"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError() {
  return (
    <html lang="es">
      <body>
        <div className="grid min-h-dvh place-content-center bg-bg px-4">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-soft">
            <p className="mb-2 inline-flex rounded-full bg-[#FFECEC] px-3 py-1 text-xs font-black text-danger">Error crítico</p>
            <h2 className="text-2xl font-black">El sistema encontró un error global</h2>
            <p className="mt-2 text-sm text-ink">No se pudo continuar con la aplicación.</p>
            <p className="mt-3 rounded-xl bg-[#F3F6FB] p-3 text-sm text-[#334155]">
              <span className="font-bold">Posible solución:</span> recargá el sitio. Si sigue igual, revisá variables de entorno y conexión a la base.
            </p>
            <Button className="mt-4 w-full" onClick={() => (window.location.href = "/")}>Volver al inicio</Button>
          </div>
        </div>
      </body>
    </html>
  );
}
