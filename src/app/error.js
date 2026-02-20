"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({ error, reset }) {
  useEffect(() => {
    // Keep a trace in browser console for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-content-center bg-bg px-4">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-soft">
        <p className="mb-2 inline-flex rounded-full bg-[#FFECEC] px-3 py-1 text-xs font-black text-danger">Error del sistema</p>
        <h2 className="text-2xl font-black">No se pudo renderizar esta pantalla</h2>
        <p className="mt-2 text-sm text-ink">{error?.message || "Se produjo un error inesperado."}</p>
        <p className="mt-3 rounded-xl bg-[#F3F6FB] p-3 text-sm text-[#334155]">
          <span className="font-bold">Posible solución:</span> recargá la página. Si persiste, volvé al inicio e intentá de nuevo.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>Ir al inicio</Button>
        </div>
      </div>
    </div>
  );
}
