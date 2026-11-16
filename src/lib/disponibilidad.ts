import "server-only";
import { db } from "./db";
import { getConfig } from "./config";
import { ahora, inicioFranja, isoAFecha, sumarDias } from "./formato";
import { ACTIVAS } from "./estados";

export type EstadoFranja = "libre" | "ocupada" | "pendiente" | "tuya" | "fuera" | "pasada";
export type Franja = { hora: number; estado: EstadoFranja; motivo?: string };

/** Vence las reservas de externos que no pagaron a tiempo (se llama en cada consulta relevante y en el cron) */
export async function vencerReservas() {
  const vencidas = await db.reserva.findMany({
    where: { estado: "pendiente_pago", limitePago: { lt: new Date() } },
    include: { usuario: true, cancha: true, factura: true },
  });
  if (!vencidas.length) return [];
  await db.$transaction([
    db.reserva.updateMany({ where: { id: { in: vencidas.map((r) => r.id) } }, data: { estado: "vencida" } }),
    db.factura.updateMany({ where: { reservaId: { in: vencidas.map((r) => r.id) }, estado: "sin_pagar" }, data: { estado: "vencida" } }),
    db.notificacion.createMany({
      data: vencidas.map((r) => ({ usuarioId: r.usuarioId, tipo: "vencida", titulo: "Tu reserva venció", mensaje: `No recibimos el pago de ${r.cancha.nombre} a tiempo y la franja se liberó.`, enlace: `/portal/reservas/${r.codigo}` })),
    }),
  ]);
  return vencidas;
}

export async function franjasDelDia(canchaId: string, iso: string, usuarioId?: string): Promise<Franja[]> {
  const cfg = await getConfig();
  const cancha = await db.cancha.findUnique({ where: { id: canchaId } });
  if (!cancha) return [];
  const fecha = isoAFecha(iso);
  const [reservas, bloqueos] = await Promise.all([
    db.reserva.findMany({ where: { canchaId, fecha, estado: { in: [...ACTIVAS] } } }),
    db.bloqueo.findMany({ where: { canchaId, desde: { lt: inicioFranja(iso, cfg.horaCierre) }, hasta: { gt: inicioFranja(iso, cfg.horaApertura) } } }),
  ]);
  const n = ahora();
  const cerrado = !cfg.diasServicio.includes(fecha.getUTCDay());
  const out: Franja[] = [];
  for (let h = cfg.horaApertura; h < cfg.horaCierre; h++) {
    const ini = inicioFranja(iso, h), fin = inicioFranja(iso, h + 1);
    const bloq = bloqueos.find((b) => b.desde < fin && b.hasta > ini);
    const r = reservas.find((x) => x.horaInicio === h);
    let estado: EstadoFranja = "libre";
    let motivo: string | undefined;
    if (iso < n.iso || (iso === n.iso && h <= n.hora)) estado = "pasada";
    else if (cancha.estado === "fuera_de_servicio" || cerrado) { estado = "fuera"; motivo = cerrado ? "Sin servicio este día" : "Escenario fuera de servicio"; }
    else if (bloq) { estado = "fuera"; motivo = bloq.motivo; }
    if (r && estado !== "pasada") estado = usuarioId && r.usuarioId === usuarioId ? "tuya" : r.estado === "pendiente_pago" || r.estado === "en_validacion" ? "pendiente" : "ocupada";
    else if (r && estado === "pasada" && usuarioId && r.usuarioId === usuarioId) estado = "tuya";
    out.push({ hora: h, estado, motivo });
  }
  return out;
}

/** Resumen de hoy para el marcador "Hoy en los escenarios" */
export async function resumenHoy() {
  await vencerReservas();
  const n = ahora();
  const canchas = await db.cancha.findMany({ orderBy: { orden: "asc" } });
  const filas = await Promise.all(
    canchas.map(async (c) => {
      const franjas = await franjasDelDia(c.id, n.iso);
      const bloqueo = await db.bloqueo.findFirst({ where: { canchaId: c.id, desde: { lte: new Date() }, hasta: { gte: new Date() } }, orderBy: { hasta: "desc" } });
      return { cancha: c, franjas, libres: franjas.filter((f) => f.estado === "libre").length, bloqueo };
    })
  );
  return { hoy: n, filas, total: filas.reduce((a, f) => a + f.libres, 0) };
}

/** Sugiere franjas libres cercanas cuando no hay cupo */
export async function alternativas(canchaId: string, iso: string, max = 4) {
  const canchas = await db.cancha.findMany({ where: { estado: "activa" }, orderBy: { orden: "asc" } });
  const out: Array<{ canchaId: string; slug: string; cancha: string; iso: string; hora: number }> = [];
  for (let d = 0; d < 4 && out.length < max; d++) {
    const dia = sumarDias(iso, d);
    for (const c of [canchas.find((x) => x.id === canchaId), ...canchas.filter((x) => x.id !== canchaId)]) {
      if (!c) continue;
      const fr = await franjasDelDia(c.id, dia);
      for (const f of fr) {
        if (f.estado === "libre" && f.hora >= 16) { out.push({ canchaId: c.id, slug: c.slug, cancha: c.nombre, iso: dia, hora: f.hora }); break; }
      }
      if (out.length >= max) break;
    }
  }
  return out;
}
