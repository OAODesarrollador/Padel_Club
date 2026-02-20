import Link from "next/link";
import Image from "next/image";

export function TopBar({ title, left, right }) {
  return (
    <header className="app-topbar sticky top-0 z-30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="w-10">{left}</div>
        <h1 className="app-topbar-title text-xl font-extrabold tracking-tight">{title}</h1>
        <div className="w-10 text-right">{right}</div>
      </div>
    </header>
  );
}

export function Card({ className = "", children }) {
  return <section className={`surface-card p-4 ${className}`}>{children}</section>;
}

export function Pill({ children, active = false, color = "default" }) {
  const palette = {
    default: active ? "status-badge status-badge--info" : "status-badge",
    success: "status-badge status-badge--available",
    danger: "status-badge status-badge--reserved"
  };
  return <span className={`${palette[color]}`}>{children}</span>;
}

export function BottomNav({ items }) {
  return (
    <nav className="app-bottom-nav">
      <div className="app-nav-wrap mx-auto w-full max-w-6xl px-4 py-2">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`app-nav-link ${it.active ? "is-active" : ""}`}
          >
            <span>{it.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function BrandMark({ size = "md" }) {
  const imageSize = size === "xl" ? 84 : 28;
  const imageClass = size === "xl" ? "h-[84px] w-[84px] rounded-md object-cover" : "h-7 w-7 rounded-sm object-cover";
  const textClass = size === "xl" ? "text-base font-black uppercase tracking-wider text-primary" : "text-[11px] font-black uppercase tracking-wider text-primary";
  return (
    <div className="inline-flex items-center gap-2">
      <Image src="/images/logoPadel.png" alt="Logo Club Deportivo" width={imageSize} height={imageSize} className={imageClass} />
      <span className={textClass}>ClubDeportivo</span>
    </div>
  );
}
