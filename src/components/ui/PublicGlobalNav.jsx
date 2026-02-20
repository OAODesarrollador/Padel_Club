"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/AppScaffold";

const items = [
  { href: "/", label: "Inicio" },
  { href: "/reservar", label: "Reservas" },
  { href: "/eventos", label: "Eventos" },
  { href: "/nosotros", label: "Nosotros" }
];

export function PublicGlobalNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`public-global-nav ${isHome ? "is-home" : "is-subpage"} ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="public-global-nav__inner">
        <div className="public-global-nav__brand">
          <BrandMark />
        </div>
        <nav className="app-nav-wrap public-global-nav__menu">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
