import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { ahora, sumarDias, isoAFecha, fechaAIso, fechaLarga, hora, diaCorto, nombreMes, inicioFranja } from "@/lib/formato";
import { ACTIVAS, ESTADOS } from "@/lib/estados";

export const dynamic = "force-dynamic";

export default async function Calendario({ searchParams }: { searchParams: Promise<{ vista?: string; fecha?: string; cancha?: string }> }) {
  const sp = await searchParams;
  const cfg = await getConfig();
  const hoy = ahora().iso;
  const vista = sp.vista ?? "dia";
  const fecha = sp.fecha ?? hoy;
  const canchas = await db.cancha.findMany({ orderBy: { orden: "asc" } });
  const cancha = canchas.find((c) => c.slug === sp.cancha) ?? canchas[0]!;
  const horas = Array.from({ length: cfg.horaCierre - cfg.horaApertura }, (_, i) => cfg.horaApertura + i);
  const d0 = isoAFecha(fecha);
  const lunes = sumarDias(fecha, -((d0.getUTCDay() + 6) % 7));
  const mesIni = `${fecha.slice(0, 7)}-01`;
  const rango = vista === "dia" ? [fecha, fecha] : vista === "semana" ? [lunes, sumarDias(lunes, 6)] : [sumarDias(mesIni, -((isoAFecha(mesIni).getUTCDay() + 6) % 7)), sumarDias(sumarDias(mesIni, -((isoAFecha(mesIni).getUTCDay() + 6) % 7)), 41)];
  const [reservas, bloqueos] = await Promise.all([
    db.reserva.findMany({ where: { fecha: { gte: isoAFecha(rango[0]!), lte: isoAFecha(rango[1]!) }, estado: { in: [...ACTIVAS] }, ...(vista !== "dia" ? { canchaId: cancha.id } : {}) }, include: { usuario: true } }),
    db.bloqueo.findMany({ where: { desde: { lt: inicioFranja(rango[1]!, 24) }, hasta: { gt: inicioFranja(rango[0]!, 0) } } }),
  ]);
  const bloq = (canchaId: string, iso: string, h: number) => bloqueos.find((b) => b.canchaId === canchaId && b.desde < inicioFranja(iso, h + 1) && b.hasta > inicioFranja(iso, h));
  const paso = vista === "dia" ? 1 : vista === "semana" ? 7 : 0;
  const nav = (dir: number) => { let f = fecha; if (vista === "mes") { const d = isoAFecha(mesIni); d.setUTCMonth(d.getUTCMonth() + dir); f = fechaAIso(d); } else f = sumarDias(fecha, dir * paso); return `/bienestar/calendario?vista=${vista}&fecha=${f}&cancha=${cancha.slug}`; };
  const url = (v: string) => `/bienestar/calendario?vista=${v}&fecha=${fecha}&cancha=${cancha.slug}`;
  const titulo = vista === "dia" ? fechaLarga(fecha, true) : vista === "semana" ? `Semana del ${fechaLarga(lunes)} al ${fechaLarga(sumarDias(lunes, 6))}` : `${nombreMes(d0.getUTCMonth())} de ${d0.getUTCFullYear()}`;
  const Evento = ({ r }: { r: (typeof reservas)[number] }) => <Link href={`/bienestar/reservas/${r.codigo}`} className={`evento evento--${r.estado}`} title={`${r.codigo} · ${ESTADOS[r.estado]}`}><b>{r.usuario.nombres.split(" ")[0]} {r.usuario.apellidos.split(" ")[0] ?? ""}</b>{r.actividad} · {ESTADOS[r.estado]}</Link>;
  return (
    <>
      <div className="pag-cab"><div><h1>Calendario</h1><p className="t-h4" style={{ color: "var(--tinta)", marginTop: 8 }}>{titulo}</p></div>
        <div className="acciones">
          <nav className="cal-vistas" aria-label="Vista">{[["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]].map(([v, t]) => <Link key={v} href={url(v!)} aria-current={vista === v ? "page" : undefined}>{t}</Link>)}</nav>
          <Link href={nav(-1)} className="btn btn-fantasma" aria-label="Anterior" style={{ border: "1px solid var(--borde)", padding: 0, width: 44 }}><ChevronLeft className="i" /></Link>
          <Link href={`/bienestar/calendario?vista=${vista}&fecha=${hoy}&cancha=${cancha.slug}`} className="btn btn-fantasma" style={{ border: "1px solid var(--borde)" }}>Hoy</Link>
          <Link href={nav(1)} className="btn btn-fantasma" aria-label="Siguiente" style={{ border: "1px solid var(--borde)", padding: 0, width: 44 }}><ChevronRight className="i" /></Link>
        </div>
      </div>
      {vista !== "dia" && <nav className="fila" style={{ marginBottom: 16 }} aria-label="Cancha">{canchas.map((c) => <Link key={c.id} href={`/bienestar/calendario?vista=${vista}&fecha=${fecha}&cancha=${c.slug}`} className={`btn btn-sm ${c.id === cancha.id ? "btn-secundario" : "btn-fantasma"}`} style={c.id === cancha.id ? undefined : { border: "1px solid var(--borde)" }}>{c.nombre}</Link>)}</nav>}

      {vista === "dia" && (
        <div className="cal-dia" style={{ gridTemplateColumns: `72px repeat(${canchas.length}, minmax(150px,1fr))` }}>
          <div className="cab-c" style={{ position: "sticky", left: 0, zIndex: 2 }} />
          {canchas.map((c) => <div key={c.id} className="cab-c">{c.nombre}</div>)}
          {horas.map((h) => (
            <div key={h} style={{ display: "contents" }}>
              <div className="hh">{hora(h)}</div>
              {canchas.map((c) => { const r = reservas.find((x) => x.canchaId === c.id && x.horaInicio === h); const b = bloq(c.id, fecha, h); return <div key={c.id} className="cel" style={{ borderBottom: "1px solid var(--borde)" }}>{r ? <Evento r={r} /> : b || c.estado === "fuera_de_servicio" ? <span className="evento evento--bloqueo"><b>Bloqueado</b>{b?.motivo ?? "Fuera de servicio"}</span> : null}</div>; })}
            </div>
          ))}
        </div>
      )}
      {vista === "semana" && (() => { const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)); return (
        <div className="cal-dia" style={{ gridTemplateColumns: `72px repeat(7, minmax(120px,1fr))` }}>
          <div className="cab-c" style={{ position: "sticky", left: 0, zIndex: 2 }} />
          {dias.map((d) => <div key={d} className="cab-c" style={d === hoy ? { color: "var(--rojo-600)" } : undefined}>{diaCorto(d)} {Number(d.slice(8))}</div>)}
          {horas.map((h) => (
            <div key={h} style={{ display: "contents" }}>
              <div className="hh">{hora(h)}</div>
              {dias.map((d) => { const r = reservas.find((x) => fechaAIso(x.fecha) === d && x.horaInicio === h); const b = bloq(cancha.id, d, h); const cerrado = !cfg.diasServicio.includes(isoAFecha(d).getUTCDay()); return <div key={d} className="cel" style={{ borderBottom: "1px solid var(--borde)", background: cerrado ? "var(--gris-50)" : undefined }}>{r ? <Evento r={r} /> : b ? <span className="evento evento--bloqueo"><b>Bloqueado</b>{b.motivo}</span> : null}</div>; })}
            </div>
          ))}
        </div>
      ); })()}
      {vista === "mes" && (() => { const dias = Array.from({ length: 42 }, (_, i) => sumarDias(rango[0]!, i)); const cap = horas.length; return (
        <div className="cal-mes">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => <div key={d} className="dn">{d}</div>)}
          {dias.map((d) => { const n = reservas.filter((r) => fechaAIso(r.fecha) === d).length; const fuera = d.slice(0, 7) !== fecha.slice(0, 7); const b = bloqueos.some((x) => x.canchaId === cancha.id && x.desde < inicioFranja(d, 24) && x.hasta > inicioFranja(d, 0)); return (
            <Link key={d} href={`/bienestar/calendario?vista=dia&fecha=${d}&cancha=${cancha.slug}`} className={`d ${fuera ? "fuera" : ""} ${d === hoy ? "hoy" : ""}`} aria-label={`${fechaLarga(d)}: ${n} reservas`}>
              <span className="n">{Number(d.slice(8))}</span>
              {n > 0 && <span>{n} reservas</span>}{b && <span style={{ color: "var(--alerta)", fontWeight: 700 }}>Bloqueo</span>}
              <span className="ocup"><i style={{ width: `${Math.min(100, (n / cap) * 100)}%` }} /></span>
            </Link>
          ); })}
        </div>
      ); })()}
    </>
  );
}
