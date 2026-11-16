"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Circle, Lock, Hourglass, Clock, Wrench, ArrowRight } from "lucide-react";

type Fila = { slug: string; nombre: string; deportes: string; libres: number; franjas: Array<{ hora: number; estado: string }>; fuera?: string };
const hh = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "a. m." : "p. m."}`;
const corto = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a. m." : "p. m."}`;
const IC: Record<string, typeof Circle> = { libre: Circle, ocupada: Lock, tuya: Lock, pendiente: Hourglass, pasada: Clock, fuera: Wrench };
const LAB: Record<string, string> = { libre: "Libre", ocupada: "Ocupada", tuya: "Ocupada", pendiente: "Pendiente de pago", pasada: "Pasada", fuera: "Fuera de servicio" };

export function Marcador({ filas, total, fecha, actualizado, horaActual, isoHoy, horas }: { filas: Fila[]; total: number; fecha: string; actualizado: string; horaActual: number; isoHoy: string; horas: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; html: React.ReactNode } | null>(null);
  useEffect(() => {
    if (innerWidth > 760) return;
    ref.current?.querySelectorAll<HTMLElement>(".celdas").forEach((c) => { const a = c.querySelector<HTMLElement>(".celda--ahora") ?? c.querySelector<HTMLElement>(".celda--libre"); if (a) c.scrollLeft = a.offsetLeft - c.offsetLeft - 18; });
  }, []);
  const mostrar = (e: React.SyntheticEvent<HTMLElement>, f: Fila, h: number, est: string) => {
    const r = e.currentTarget.getBoundingClientRect(), p = ref.current!.getBoundingClientRect();
    setTip({ x: r.left - p.left + r.width / 2, y: r.top - p.top, html: <><b>{f.nombre}</b>{hh(h)} – {hh(h + 1)}<br /><span style={{ color: est === "libre" ? "var(--exito)" : "var(--gris-700)" }}>{LAB[est]}{est === "libre" ? ", clic para reservar" : ""}</span></> });
  };
  return (
    <section className="marcador oscuro" aria-labelledby="hoy" ref={ref}>
      <div className="m-cab">
        <div><h2 id="hoy">Hoy en los escenarios</h2><div className="fecha">{fecha}</div></div>
        <span className="vivo"><i />En vivo, actualizado a las {actualizado}</span>
        <div className="total"><b>{total}</b><span>franjas libres<br />por el resto del día</span></div>
      </div>
      <div className="m-cuerpo">
        <div className="m-horas" aria-hidden><span /><div className="h" style={{ gridTemplateColumns: `repeat(${horas.length},1fr)` }}>{horas.map((h) => <span key={h} className={h === horaActual ? "ahora" : ""}>{h === horaActual ? "Ahora" : h % 2 === 0 ? corto(h) : ""}</span>)}</div></div>
        {filas.map((f) => (
          <div className="m-fila" key={f.slug}>
            <div className="nom"><span className={`n ${f.fuera ? "cero" : ""}`}>{f.fuera ? "–" : f.libres}</span><div><b>{f.nombre}</b><small>{f.fuera ? "No disponible hoy" : f.deportes}</small></div></div>
            <div className="celdas" style={{ gridTemplateColumns: `repeat(${horas.length},1fr)` }}>
              {f.fuera ? <div className="fuera"><Wrench className="i" />{f.fuera}</div> : f.franjas.map((fr) => {
                const est = fr.estado === "tuya" ? "ocupada" : fr.estado;
                const I = IC[est] ?? Circle;
                const ahora = fr.hora === horaActual;
                const cls = `celda celda--${est}${ahora ? " celda--ahora" : ""}`;
                const etiqueta = `${f.nombre}, ${hh(fr.hora)}: ${LAB[est]}${ahora ? " (en curso)" : ""}`;
                const cont = <><span className="hm">{corto(fr.hora).replace(" ", " ")}</span><I className="i" /></>;
                const ev = { onMouseEnter: (e: React.MouseEvent<HTMLElement>) => mostrar(e, f, fr.hora, est), onFocus: (e: React.FocusEvent<HTMLElement>) => mostrar(e, f, fr.hora, est), onMouseLeave: () => setTip(null), onBlur: () => setTip(null) };
                return est === "libre" ? <Link key={fr.hora} href={`/portal/reservar?cancha=${f.slug}&fecha=${isoHoy}&hora=${fr.hora}`} className={cls} aria-label={etiqueta} {...ev}>{cont}</Link> : <div key={fr.hora} className={cls} aria-label={etiqueta} role="img" {...ev}>{cont}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="desliza"><ArrowRight className="i i-sm" />Desliza para ver más horas</p>
      <div className="m-pie">
        <div className="m-ley">
          <span><i style={{ border: "1px solid rgba(255,255,255,.3)" }}><Circle className="i" style={{ color: "#6FD39F" }} /></i>Libre</span>
          <span><i style={{ background: "repeating-linear-gradient(135deg,#2A3846 0 3px,#3A4856 3px 6px)" }}><Lock className="i" style={{ color: "#8E9BA7" }} /></i>Ocupada</span>
          <span><i style={{ background: "rgba(178,106,0,.3)" }}><Hourglass className="i" style={{ color: "#F3B04A" }} /></i>Pendiente de pago</span>
          <span><i style={{ border: "1px dashed rgba(255,255,255,.3)", opacity: 0.6 }}><Clock className="i" /></i>Pasada</span>
          <span><i style={{ outline: "2px solid var(--amarillo-400)", outlineOffset: -2 }} />Hora actual</span>
        </div>
        <Link className="btn btn-destacado" href="/portal/reservar">Reservar una franja</Link>
      </div>
      {tip && <div className="m-tip on" style={{ left: tip.x, top: tip.y }} role="status">{tip.html}</div>}
    </section>
  );
}
