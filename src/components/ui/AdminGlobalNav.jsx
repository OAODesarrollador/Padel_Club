"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/canchas", label: "Canchas" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/ajustes", label: "Ajustes" }
];

export function AdminGlobalNav() {
  const pathname = usePathname();
  return (
    <header className="admin-global-nav">
      <div className="admin-global-nav__inner">
        <p className="admin-global-nav__title">Administración</p>
        <nav className="app-nav-wrap admin-global-nav__menu">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`app-nav-link ${active ? "is-active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
