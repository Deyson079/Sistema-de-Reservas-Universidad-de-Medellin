import { Wrench, CircleCheck, Trash2, Users, Ruler } from "lucide-react";
import { db } from "@/lib/db";
import { ahora, fechaHora } from "@/lib/formato";
import { cambiarEstadoCancha, eliminarBloqueo } from "@/lib/acciones-staff";
import { ChipEstado } from "@/components/ui/Chip";
import { Ilustracion } from "@/components/Ilustracion";
import { BotonEnviar } from "@/components/ui/Cliente";
import { FormBloqueo } from "./formulario";

export const dynamic = "force-dynamic";

export default async function GestionCanchas() {
  const canchas = await db.cancha.findMany({ orderBy: { orden: "asc" }, include: { bloqueos: { where: { hasta: { gte: new Date() } }, orderBy: { desde: "asc" } } } });
  return (
    <>
      <div className="pag-cab"><div><h1>Canchas</h1><p>Pon un escenario fuera de servicio o bloquea fechas para eventos institucionales.</p></div></div>
      <div className="grid-2">
        {canchas.map((c) => (
          <article key={c.id} className="tarjeta" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr" }}>
              <div className="grano" style={{ position: "relative", overflow: "hidden", background: "#7A1C20", minHeight: 150 }}><Ilustracion tipo={c.ilustracion} className="ilus" style={{ position: "absolute", inset: "-60%", transform: "perspective(700px) rotateX(48deg) rotateZ(-22deg)", filter: c.estado === "activa" ? undefined : "grayscale(.7) brightness(.75)" }} /></div>
              <div style={{ padding: 18 }}>
                <div className="fila-entre"><h2 className="t-h4" style={{ margin: 0 }}>{c.nombre}</h2>{c.estado === "activa" ? <ChipEstado estado="confirmada" texto="Activa" /> : <ChipEstado estado="fuera_de_servicio" />}</div>
                <div className="fila chico texto-2 mt-1"><span className="fila" style={{ gap: 4 }}><Users className="i i-sm" />{c.capacidad}</span><span className="fila" style={{ gap: 4 }}><Ruler className="i i-sm" />{c.dimensiones}</span><span>{c.deportes.join(", ")}</span></div>
                <form action={cambiarEstadoCancha} className="mt-2"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="estado" value={c.estado === "activa" ? "fuera_de_servicio" : "activa"} />
                  {c.estado === "activa" ? <BotonEnviar className="btn btn-contorno btn-sm" style={{ color: "var(--tinta)" }}><Wrench className="i i-sm" />Poner fuera de servicio</BotonEnviar> : <BotonEnviar className="btn btn-secundario btn-sm"><CircleCheck className="i i-sm" />Volver a activar</BotonEnviar>}
                </form>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--borde)", padding: "12px 18px" }}>
              <b className="chico">Bloqueos programados</b>
              {c.bloqueos.length ? c.bloqueos.map((b) => (
                <div key={b.id} className="fila-entre" style={{ padding: "8px 0", borderBottom: "1px dashed var(--borde)" }}>
                  <div className="chico"><span className="badge" style={{ background: b.tipo === "evento" ? "var(--amarillo-100)" : "var(--gris-200)", color: "var(--tinta)", marginRight: 8 }}>{b.tipo === "evento" ? "Evento" : "Mantenimiento"}</span><b>{b.motivo}</b><br /><span className="texto-2">{fechaHora(b.desde)} → {fechaHora(b.hasta)}</span></div>
                  <form action={eliminarBloqueo}><input type="hidden" name="id" value={b.id} /><button className="cerrar" aria-label={`Eliminar bloqueo ${b.motivo}`}><Trash2 className="i i-sm" /></button></form>
                </div>
              )) : <p className="chico texto-2" style={{ margin: "6px 0 0" }}>Sin bloqueos.</p>}
            </div>
          </article>
        ))}
      </div>
      <section className="tarjeta mt-3" id="bloqueo"><h2 className="t-h4" style={{ margin: "0 0 16px" }}>Nuevo bloqueo por rango de fechas</h2><FormBloqueo canchas={canchas} hoy={ahora().iso} /></section>
    </>
  );
}
