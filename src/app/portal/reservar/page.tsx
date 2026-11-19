import Link from "next/link";
import { Lightbulb, ArrowRight } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { ahora, sumarDias, fechaLarga, franja, diaCorto, isoAFecha, hora as fmtHora } from "@/lib/formato";
import { disponibilidad, alternativas, vencerReservasPeriodico } from "@/lib/disponibilidad";
import { Stepper } from "@/components/ui/Varios";
import { Fijable } from "@/components/ui/Cliente";
import { CuadriculaFranjas, LeyendaFranjas } from "@/components/portal/Franjas";

export const metadata = { title: "Reservar" };
export const dynamic = "force-dynamic";

export default async function Reservar({ searchParams }: { searchParams: Promise<{ cancha?: string; fecha?: string; hora?: string; sincupo?: string }> }) {
  const sp = await searchParams;
  const u = await requireUsuario();
  const [, cfg, canchas] = await Promise.all([vencerReservasPeriodico(), getConfig(), db.cancha.findMany({ orderBy: { orden: "asc" } })]);
  const n = ahora();
  const cancha = canchas.find((c) => c.slug === sp.cancha) ?? canchas.find((c) => c.estado === "activa") ?? canchas[0]!;
  const dias = Array.from({ length: cfg.diasAnticipacion }, (_, i) => sumarDias(n.iso, i));
  const fecha = sp.fecha && dias.includes(sp.fecha) ? sp.fecha : dias.find((d) => cfg.diasServicio.includes(isoAFecha(d).getUTCDay())) ?? dias[0]!;
  // Todas las franjas de la página (todas las canchas, todos los días) en dos consultas
  const disp = await disponibilidad(canchas, dias, u.id, cfg);
  const libresDe = (canchaId: string, d: string) => disp.de(canchaId, d).filter((f) => f.estado === "libre").length;
  const conteos = dias.map((d) => libresDe(cancha.id, d));
  const franjas = disp.de(cancha.id, fecha);
  const hSel = sp.hora ? Number(sp.hora) : undefined;
  const sel = franjas.find((f) => f.hora === hSel && f.estado === "libre") ? hSel : undefined;
  const libres = franjas.filter((f) => f.estado === "libre").length;
  const alt = libres === 0 || sp.sincupo ? await alternativas(cancha.id, fecha) : [];
  const url = (p: Record<string, string | number | undefined>) => { const q = new URLSearchParams(); const v = { cancha: cancha.slug, fecha, ...p }; for (const [k, x] of Object.entries(v)) if (x !== undefined) q.set(k, String(x)); return `/portal/reservar?${q}`; };
  const contadoresCancha = canchas.map((c) => libresDe(c.id, fecha));

  return (
    <>
      <div className="reservar-cab">
        <div className="contenedor">
          <div className="pag-cab" style={{ margin: "24px 0 0" }}><div><h1>Reservar</h1><p>Elige el escenario, el día y una franja libre de 1 hora.</p></div></div>
          <Stepper paso={1} pasos={["Elige cancha y franja", "Datos de la reserva", "Confirmar"]} />
        </div>
      </div>
      <Fijable className="barra-reserva" desde={160}>
        <div className="contenedor">
          <div className="resumen">
            <div>Viendo:<b>{cancha.nombre}, {fechaLarga(fecha)}</b></div>
            <div className="tu">Tu selección:<b>{sel !== undefined ? franja(sel) : "Ninguna franja"}</b></div>
          </div>
          {sel !== undefined ? <Link className="btn btn-primario" href={`/portal/reservar/datos?cancha=${cancha.slug}&fecha=${fecha}&hora=${sel}`}>Continuar<ArrowRight className="i" /></Link> : <span className="btn" aria-disabled="true" style={{ background: "var(--gris-200)", color: "var(--gris-500)", cursor: "not-allowed" }}>Continuar</span>}
        </div>
      </Fijable>
      <div className="contenedor">
        <section className="mt-3" aria-labelledby="t-cancha">
          <h2 className="t-h4" id="t-cancha" style={{ marginBottom: 12 }}>1. Escenario</h2>
          <div className="canchas-sel">
            {canchas.map((c, i) => (
              <Link key={c.id} href={url({ cancha: c.slug, hora: undefined })} scroll={false} className={`cancha-op ${c.estado !== "activa" ? "off" : ""}`} aria-current={c.id === cancha.id ? "true" : undefined}>
                <span className="mini-foto"><span style={{ position: "absolute", inset: 0 }}><MiniIlus tipo={c.ilustracion} /></span></span>
                <span><b>{c.nombre}</b><small>{c.estado !== "activa" ? "Fuera de servicio" : `${contadoresCancha[i]} libres este día · hasta ${c.capacidad} personas`}</small></span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mt-4" aria-labelledby="t-dia">
          <h2 className="t-h4" id="t-dia" style={{ marginBottom: 12 }}>2. Día</h2>
          <div className="dias" role="group" aria-label="Próximos 14 días">
            {dias.map((d, i) => {
              const cerrado = !cfg.diasServicio.includes(isoAFecha(d).getUTCDay());
              return cerrado
                ? <span key={d} className="dia" aria-disabled="true" style={{ background: "var(--gris-50)", color: "var(--gris-500)", borderStyle: "dashed", cursor: "not-allowed" }} aria-label={`${fechaLarga(d)}, sin servicio`}><small>{diaCorto(d)}</small><b>{Number(d.slice(8))}</b><em style={{ color: "var(--gris-500)" }}>Cerrado</em></span>
                : <Link key={d} href={url({ fecha: d, hora: undefined })} scroll={false} className={`dia ${i === 0 ? "hoy" : ""}`} aria-pressed={d === fecha} aria-label={`${fechaLarga(d)}, ${conteos[i]} franjas libres`}><small>{diaCorto(d)}</small><b>{Number(d.slice(8))}</b><em style={conteos[i] === 0 ? { color: "var(--error)" } : undefined}>{conteos[i] === 0 ? "Sin cupo" : `${conteos[i]} libres`}</em></Link>;
            })}
          </div>
        </section>
        <section className="mt-3" aria-labelledby="t-franja">
          <div className="fila-entre" style={{ marginBottom: 14 }}><h2 className="t-h4" id="t-franja">3. Franja de 1 hora</h2><LeyendaFranjas /></div>
          <CuadriculaFranjas franjas={franjas} sel={sel} href={(h) => url({ hora: h })} />
        </section>
        {alt.length > 0 && (
          <section className="tarjeta mt-4" aria-labelledby="t-alt">
            <div className="fila" style={{ marginBottom: 12 }}><Lightbulb className="i" style={{ color: "var(--alerta)" }} /><h2 className="t-tarjeta" id="t-alt" style={{ margin: 0 }}>{libres === 0 ? `No hay franjas libres en ${cancha.nombre} este día.` : "Otras franjas libres cercanas"} Prueba con estas:</h2></div>
            <div className="alternativas">
              {alt.map((a) => <Link key={`${a.canchaId}${a.iso}${a.hora}`} href={`/portal/reservar?cancha=${a.slug}&fecha=${a.iso}&hora=${a.hora}`}><b>{fmtHora(a.hora)}</b>{a.cancha}<br /><span className="texto-2">{fechaLarga(a.iso)}</span></Link>)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

import { svgCancha } from "@/components/canchas-svg";
function MiniIlus({ tipo }: { tipo: string }) {
  return <span style={{ position: "absolute", inset: 0, display: "block" }} dangerouslySetInnerHTML={{ __html: svgCancha(tipo) }} />;
}
