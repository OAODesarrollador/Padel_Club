import { Suspense } from "react";
import { GestionarClient } from "./GestionarClient";

export default function GestionarPage() {
  return (
    <Suspense fallback={<section className="p-4 text-sm text-muted">Cargando gestión...</section>}>
      <GestionarClient />
    </Suspense>
  );
}
