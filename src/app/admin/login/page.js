"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { mapApiError } from "@/lib/clientFeedback";

export default function AdminLoginPage() {
  const router = useRouter();
  const feedback = useFeedback();
  const [email, setEmail] = useState("admin@club.com");
  const [password, setPassword] = useState("admin123");

  async function login(e) {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        feedback.showError({
          ...mapApiError({
            error: data?.error,
            status: response.status,
            fallbackMessage: "Credenciales inválidas.",
            fallbackSolution: "Usá un usuario existente del seed o verificá email/clave."
          }),
          code: "ADMIN_LOGIN_ERROR"
        });
        return;
      }
      router.push("/admin/reservas");
    } catch {
      feedback.showError({
        ...mapApiError({
          fallbackMessage: "No se pudo conectar para iniciar sesión.",
          fallbackSolution: "Revisá internet o estado del servidor local."
        }),
        code: "NETWORK_ERROR"
      });
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-line bg-white p-6 shadow-soft">
      <h1 className="mb-2 text-4xl font-black">Panel de Personal</h1>
      <p className="mb-4 text-sm text-muted">Acceso administrador/secretario</p>
      <form className="space-y-3" onSubmit={login}>
        <input className="w-full rounded-xl border border-line px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" />
        <input className="w-full rounded-xl border border-line px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
        <Button className="w-full" type="submit">Ingresar</Button>
      </form>
    </div>
  );
}
