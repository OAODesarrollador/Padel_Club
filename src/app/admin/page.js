import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyStaffToken } from "@/lib/security/jwt";

const modules = [
  {
    key: "reservas",
    title: "Horarios Alquilados",
    description: "Agenda, altas, cancelaciones, reprogramaciones y cobros.",
    href: "/admin/reservas",
    roles: ["ADMIN", "SECRETARY"]
  },
  {
    key: "canchas",
    title: "Datos de Canchas",
    description: "Precios, estado, duración mínima e imagen de cada cancha.",
    href: "/admin/canchas",
    roles: ["ADMIN"]
  },
  {
    key: "eventos",
    title: "Datos de Eventos",
    description: "Publicación y edición de eventos deportivos del club.",
    href: "/admin/eventos",
    roles: ["ADMIN"]
  },
  {
    key: "ajustes",
    title: "Ajustes del Sistema",
    description: "Configuración general, reglas y parámetros del club.",
    href: "/admin/ajustes",
    roles: ["ADMIN"]
  }
];

export default async function AdminIndexPage() {
  const token = (await cookies()).get("staff_token")?.value;
  if (!token) redirect("/admin/login");

  let staff;
  try {
    staff = await verifyStaffToken(token);
  } catch {
    redirect("/admin/login");
  }

  const role = String(staff?.role || "SECRETARY");
  const name = String(staff?.name || "Staff");

  return (
    <section className="mx-auto max-w-5xl space-y-5 p-4">
      <div className="surface-card p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Panel de administración</p>
        <h1 className="text-3xl font-black">Hola, {name}</h1>
        <p className="text-sm text-muted">Rol activo: {role === "ADMIN" ? "Administrador" : "Secretario / Vendedor"}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((module) => {
          const enabled = module.roles.includes(role);
          return (
            <article key={module.key} className={`surface-card p-4 ${enabled ? "" : "opacity-60"}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{enabled ? "Habilitado" : "Solo administrador"}</p>
              <h2 className="mt-1 text-2xl font-black">{module.title}</h2>
              <p className="mt-1 text-sm text-muted">{module.description}</p>
              <div className="mt-3">
                {enabled ? (
                  <Link href={module.href} className="btn btn-primary">Administrar</Link>
                ) : (
                  <button className="btn btn-outline-secondary" disabled>Sin acceso</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="pt-1">
        <Link href="/api/admin/logout" className="btn btn-outline-primary">Cerrar sesión</Link>
      </div>
    </section>
  );
}
