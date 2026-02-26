"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const items = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/canchas", label: "Canchas" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/ajustes", label: "Ajustes" }
];

export function AdminGlobalNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!open) return;
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="admin-global-nav">
      <div className="admin-global-nav__inner" ref={navRef}>
        <p className="admin-global-nav__title">
          <Image src="/images/logoPadel.png" alt="Logo Club Deportivo" width={30} height={30} className="admin-global-nav__logo" />
          <span>Administración</span>
        </p>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm admin-global-nav__toggle"
          aria-label="Abrir menú de administración"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
        <nav className={`app-nav-wrap admin-global-nav__menu ${open ? "is-open" : ""}`}>
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
      <div className={`admin-global-nav__backdrop ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} />
    </header>
  );
}
