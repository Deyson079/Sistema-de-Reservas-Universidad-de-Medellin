import "server-only";
import type { Bloqueo, Cancha, Reserva } from "@prisma/client";
import { db } from "./db";
import { getConfig, type Config } from "./config";
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

const g = globalThis as unknown as { vencerEnCurso?: Promise<unknown>; vencerUltimo?: number };
/**
 * Para las páginas: comparte la ejecución entre peticiones simultáneas y no repite antes de 15 s.
 * Crear una reserva y el cron siguen usando `vencerReservas()` directamente.
 */
export async function vencerReservasPeriodico() {
  if (g.vencerEnCurso) return g.vencerEnCurso;
  if (g.vencerUltimo && Date.now() - g.vencerUltimo < 15_000) return;
  g.vencerEnCurso = vencerReservas()
    .catch((e) => console.error("[vencer reservas]", e))
    .finally(() => { g.vencerUltimo = Date.now(); g.vencerEnCurso = undefined; });
  return g.vencerEnCurso;
}

/** Calcula las franjas de un día con los datos ya cargados (sin consultar la base de datos). */
function calcularFranjas(cancha: Cancha, iso: string, cfg: Config, reservas: Reserva[], bloqueos: Bloqueo[], usuarioId?: string): Franja[] {
  const fecha = isoAFecha(iso);
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

/**
 * Franjas de varias canchas en varios días con solo dos consultas (reservas y bloqueos).
 * Devuelve una función `de(canchaId, iso)` que entrega las franjas de esa combinación.
 */
export async function disponibilidad(canchas: Cancha[], isos: string[], usuarioId?: string, cfgDada?: Config) {
  const cfg = cfgDada ?? (await getConfig());
  const ids = canchas.map((c) => c.id);
  const ordenados = [...new Set(isos)].sort();
  const vacio = { de: (_c: string, _i: string): Franja[] => [] };
  if (!ids.length || !ordenados.length) return vacio;
  const [reservas, bloqueos] = await Promise.all([
    db.reserva.findMany({ where: { canchaId: { in: ids }, fecha: { in: ordenados.map(isoAFecha) }, estado: { in: [...ACTIVAS] } } }),
    db.bloqueo.findMany({
      where: { canchaId: { in: ids }, desde: { lt: inicioFranja(ordenados.at(-1)!, cfg.horaCierre) }, hasta: { gt: inicioFranja(ordenados[0]!, cfg.horaApertura) } },
    }),
  ]);
  const porCancha = new Map(canchas.map((c) => [c.id, c]));
  const memo = new Map<string, Franja[]>();
  return {
    de(canchaId: string, iso: string): Franja[] {
      const clave = `${canchaId}|${iso}`;
      const hecho = memo.get(clave);
      if (hecho) return hecho;
      const cancha = porCancha.get(canchaId);
      if (!cancha) return [];
      const dia = isoAFecha(iso).getTime();
      const f = calcularFranjas(
        cancha, iso, cfg,
        reservas.filter((r) => r.canchaId === canchaId && r.fecha.getTime() === dia),
        bloqueos.filter((b) => b.canchaId === canchaId),
        usuarioId,
      );
      memo.set(clave, f);
      return f;
    },
  };
}

export async function franjasDelDia(canchaId: string, iso: string, usuarioId?: string): Promise<Franja[]> {
  const [cfg, cancha] = await Promise.all([getConfig(), db.cancha.findUnique({ where: { id: canchaId } })]);
  if (!cancha) return [];
  return (await disponibilidad([cancha], [iso], usuarioId, cfg)).de(canchaId, iso);
}

/** Resumen de hoy para el marcador "Hoy en los escenarios" */
export async function resumenHoy() {
  await vencerReservasPeriodico();
  const n = ahora();
  const ahoraMismo = new Date();
  const [cfg, canchas, vigentes] = await Promise.all([
    getConfig(),
    db.cancha.findMany({ orderBy: { orden: "asc" } }),
    db.bloqueo.findMany({ where: { desde: { lte: ahoraMismo }, hasta: { gte: ahoraMismo } }, orderBy: { hasta: "desc" } }),
  ]);
  const disp = await disponibilidad(canchas, [n.iso], undefined, cfg);
  const filas = canchas.map((c) => {
    const franjas = disp.de(c.id, n.iso);
    const bloqueo = vigentes.find((b) => b.canchaId === c.id) ?? null;
    return { cancha: c, franjas, libres: franjas.filter((f) => f.estado === "libre").length, bloqueo };
  });
  return { hoy: n, filas, total: filas.reduce((a, f) => a + f.libres, 0) };
}

/** Sugiere franjas libres cercanas cuando no hay cupo */
export async function alternativas(canchaId: string, iso: string, max = 4) {
  const canchas = await db.cancha.findMany({ where: { estado: "activa" }, orderBy: { orden: "asc" } });
  const dias = Array.from({ length: 4 }, (_, d) => sumarDias(iso, d));
  const disp = await disponibilidad(canchas, dias);
  const out: Array<{ canchaId: string; slug: string; cancha: string; iso: string; hora: number }> = [];
  for (const dia of dias) {
    for (const c of [canchas.find((x) => x.id === canchaId), ...canchas.filter((x) => x.id !== canchaId)]) {
      if (!c) continue;
      const f = disp.de(c.id, dia).find((x) => x.estado === "libre" && x.hora >= 16);
      if (f) out.push({ canchaId: c.id, slug: c.slug, cancha: c.nombre, iso: dia, hora: f.hora });
      if (out.length >= max) return out;
    }
  }
  return out;
}
