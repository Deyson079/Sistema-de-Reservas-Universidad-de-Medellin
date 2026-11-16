import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { getConfig } from "./config";
import { ahora, sumarDias, isoAFecha, fechaAIso, fechaLarga, fechaCorta } from "./formato";
import { ESTADOS } from "./estados";

export type Filtros = { desde: string; hasta: string; cancha?: string; tipoUsuario?: string };

export function filtrosDesde(sp: { periodo?: string; desde?: string; hasta?: string; cancha?: string; tipo?: string }): Filtros & { periodo: string } {
  const hoy = ahora().iso;
  const periodo = sp.periodo ?? "30";
  let desde = sumarDias(hoy, -Number(periodo === "personalizado" ? 30 : periodo) + 1), hasta = hoy;
  if (periodo === "personalizado" && sp.desde && sp.hasta) { desde = sp.desde; hasta = sp.hasta; }
  if (periodo === "proximos") { desde = hoy; hasta = sumarDias(hoy, 13); }
  return { periodo, desde, hasta, cancha: sp.cancha || undefined, tipoUsuario: sp.tipo || undefined };
}

export async function estadisticas(f: Filtros) {
  const cfg = await getConfig();
  const where: Prisma.ReservaWhereInput = { fecha: { gte: isoAFecha(f.desde), lte: isoAFecha(f.hasta) }, ...(f.cancha ? { cancha: { slug: f.cancha } } : {}), ...(f.tipoUsuario ? { usuario: { tipo: f.tipoUsuario as never } } : {}) };
  const rs = await db.reserva.findMany({ where, select: { fecha: true, horaInicio: true, estado: true, participantes: true, actividad: true, canchaId: true, usuario: { select: { tipo: true } }, factura: { select: { total: true, estado: true } } } });
  const canchas = await db.cancha.findMany({ where: f.cancha ? { slug: f.cancha } : {}, orderBy: { orden: "asc" } });
  const activas = rs.filter((r) => ["confirmada", "asistio", "no_asistio", "en_validacion", "pendiente_pago"].includes(r.estado));
  const dias: string[] = [];
  for (let d = f.desde; d <= f.hasta; d = sumarDias(d, 1)) dias.push(d);
  const diasServicio = dias.filter((d) => cfg.diasServicio.includes(isoAFecha(d).getUTCDay())).length;
  const capacidad = diasServicio * (cfg.horaCierre - cfg.horaApertura) * Math.max(1, canchas.length);
  const pasadas = rs.filter((r) => ["asistio", "no_asistio"].includes(r.estado));
  const porDia = dias.map((d) => ({ etiqueta: fechaLarga(d), corta: `${fechaCorta(d).slice(0, 1).toUpperCase()} ${Number(d.slice(8))}`, valor: activas.filter((r) => fechaAIso(r.fecha) === d).length, apagada: !cfg.diasServicio.includes(isoAFecha(d).getUTCDay()) }));
  // Mapa de calor: % de ocupación por hora y día de la semana
  const horas = Array.from({ length: cfg.horaCierre - cfg.horaApertura }, (_, i) => cfg.horaApertura + i);
  const dsem = cfg.diasServicio;
  const cuentaDia = (dw: number) => dias.filter((d) => isoAFecha(d).getUTCDay() === dw).length || 1;
  const calor = horas.map((h) => dsem.map((dw) => Math.round((activas.filter((r) => r.horaInicio === h && r.fecha.getUTCDay() === dw).length / (cuentaDia(dw) * Math.max(1, canchas.length))) * 100)));
  const conteo = <T extends string>(arr: T[]) => Object.entries(arr.reduce((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);
  return {
    total: rs.length,
    activas: activas.length,
    ocupacion: capacidad ? Math.round((activas.length / capacidad) * 100) : 0,
    ingresos: rs.filter((r) => r.factura?.estado === "pagada").reduce((a, r) => a + (r.factura?.total ?? 0), 0),
    participantes: activas.reduce((a, r) => a + r.participantes, 0),
    cancelaciones: rs.filter((r) => r.estado === "cancelada").length,
    asistencia: pasadas.length ? Math.round((pasadas.filter((r) => r.estado === "asistio").length / pasadas.length) * 100) : 0,
    porDia,
    calor: { filas: horas.map((h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a. m." : "p. m."}`), columnas: dsem.map((d) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d]!), valores: calor },
    porCancha: canchas.map((c) => ({ etiqueta: c.nombre, valor: activas.filter((r) => r.canchaId === c.id).length })),
    porEstado: conteo(rs.map((r) => r.estado)).map(([k, v]) => ({ etiqueta: ESTADOS[k as keyof typeof ESTADOS], valor: v, clave: k })),
    tipo: { comunidad: activas.filter((r) => r.usuario.tipo === "comunidad").length, externo: activas.filter((r) => r.usuario.tipo === "externo").length },
    porActividad: conteo(activas.map((r) => r.actividad)).slice(0, 7).map(([k, v]) => ({ etiqueta: k, valor: v })),
  };
}
