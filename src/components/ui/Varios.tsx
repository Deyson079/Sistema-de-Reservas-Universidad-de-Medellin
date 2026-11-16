import Link from "next/link";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

export function Stepper({ paso, pasos }: { paso: number; pasos: string[] }) {
  return (
    <ol className="stepper" aria-label="Pasos de la reserva">
      {pasos.map((p, i) => (
        <li key={p} className={i + 1 < paso ? "hecho" : i + 1 === paso ? "actual" : ""} aria-current={i + 1 === paso ? "step" : undefined}>
          <span className="n">{i + 1 < paso ? <Check className="i i-sm" /> : i + 1}</span>
          <span>{p}</span>
        </li>
      ))}
    </ol>
  );
}

export function Tabs({ items, activo }: { items: Array<{ id: string; texto: string; href: string; cuenta?: number; alerta?: boolean }>; activo: string }) {
  return (
    <nav className="tabs" aria-label="Secciones">
      {items.map((t) => (
        <Link key={t.id} href={t.href} className="tab" aria-selected={t.id === activo} aria-current={t.id === activo ? "page" : undefined} scroll={false}>
          {t.texto} {t.cuenta !== undefined && <span className={`cnt ${t.alerta && t.cuenta ? "alerta" : ""}`}>{t.cuenta}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Paginacion({ pagina, total, porPagina, base, etiqueta = "registros" }: { pagina: number; total: number; porPagina: number; base: string; etiqueta?: string }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const url = (p: number) => `${base}${base.includes("?") ? "&" : "?"}pagina=${p}`;
  const desde = total ? (pagina - 1) * porPagina + 1 : 0, hasta = Math.min(total, pagina * porPagina);
  const nums = Array.from({ length: paginas }, (_, i) => i + 1).filter((n) => n === 1 || n === paginas || Math.abs(n - pagina) <= 1);
  return (
    <nav className="pag mt-3" aria-label="Paginación">
      <span className="info">Mostrando {desde}–{hasta} de {total} {etiqueta}</span>
      {pagina > 1 ? <Link className="btn btn-fantasma" style={{ minWidth: 44, padding: 0, border: "1px solid var(--borde)" }} href={url(pagina - 1)} aria-label="Página anterior"><ChevronLeft className="i" /></Link> : null}
      {nums.map((n, i) => (
        <span key={n} style={{ display: "contents" }}>
          {i > 0 && n - nums[i - 1]! > 1 && <span className="nota">…</span>}
          <Link href={url(n)} aria-current={n === pagina ? "page" : undefined} className="btn" style={{ minWidth: 44, padding: 0, border: "1px solid var(--borde)", background: n === pagina ? "var(--tinta)" : "#fff", color: n === pagina ? "#fff" : "var(--tinta)" }}>{n}</Link>
        </span>
      ))}
      {pagina < paginas ? <Link className="btn btn-fantasma" style={{ minWidth: 44, padding: 0, border: "1px solid var(--borde)" }} href={url(pagina + 1)} aria-label="Página siguiente"><ChevronRight className="i" /></Link> : null}
    </nav>
  );
}

export function Kpi({ titulo, valor, detalle, icono, tono = "rojo", alerta }: { titulo: string; valor: React.ReactNode; detalle?: React.ReactNode; icono: React.ReactNode; tono?: "rojo" | "exito" | "alerta" | "error" | "info" | "petroleo"; alerta?: boolean }) {
  const map = { rojo: ["var(--rojo-50)", "var(--rojo-600)"], exito: ["var(--exito-bg)", "var(--exito)"], alerta: ["var(--alerta-bg)", "var(--alerta)"], error: ["var(--error-bg)", "var(--error)"], info: ["var(--info-bg)", "var(--info)"], petroleo: ["var(--petroleo-50)", "var(--petroleo-700)"] };
  const [bg, c] = map[tono];
  return (
    <div className={`kpi ${alerta ? "kpi--alerta" : ""}`}>
      <div className="top"><span className="ic" style={{ background: bg, color: c }}>{icono}</span>{titulo}</div>
      <div className="v">{valor}</div>
      {detalle && <div className="d">{detalle}</div>}
    </div>
  );
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: React.ReactNode }) {
  return (
    <div className="vacio">
      <svg className="dib" viewBox="0 0 180 110" fill="none" aria-hidden><rect x="10" y="20" width="160" height="80" rx="4" stroke="#C4CAD0" strokeWidth="2" strokeDasharray="6 6" /><line x1="90" y1="20" x2="90" y2="100" stroke="#C4CAD0" strokeWidth="2" strokeDasharray="6 6" /><circle cx="90" cy="60" r="18" stroke="#C4CAD0" strokeWidth="2" strokeDasharray="6 6" /><circle cx="128" cy="44" r="14" fill="#F3D941" /><path d="M118 38c6 2 14 2 20 0M117 48c7 3 15 3 22 0" stroke="#16222F" strokeWidth="1.5" /><ellipse cx="128" cy="98" rx="14" ry="3" fill="#16222F" opacity=".12" /></svg>
      <h4>{titulo}</h4>
      <p>{texto}</p>
      {accion}
    </div>
  );
}

export function LineasCancha({ color = "#fff", opacidad = 0.14, className = "lineas" }: { color?: string; opacidad?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" fill="none" stroke={color} strokeOpacity={opacidad} strokeWidth="2" aria-hidden>
      <line x1="900" y1="0" x2="900" y2="600" /><circle cx="900" cy="300" r="150" /><circle cx="900" cy="300" r="5" fill={color} fillOpacity={opacidad} />
      <rect x="1290" y="120" width="160" height="360" /><rect x="1380" y="210" width="70" height="180" /><path d="M1290 230 A80 80 0 0 0 1290 370" />
    </svg>
  );
}
