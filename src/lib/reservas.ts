import "server-only";
import { randomInt } from "crypto";
import type { Usuario, Personal, MetodoPago } from "@prisma/client";
import { db } from "./db";
import { getConfig } from "./config";
import { ahora, fechaLarga, fechaHora, franja, inicioFranja, isoAFecha, sumarDias, fechaAIso } from "./formato";
import { franjasDelDia, vencerReservas } from "./disponibilidad";
import { enviarCorreo, qrDataUrl } from "./email";
import { notificar } from "./notificar";
import { auditar } from "./auditoria";
import { METODOS } from "./estados";

export class ErrorReserva extends Error {}

async function nuevoCodigo() {
  for (let i = 0; i < 10; i++) {
    const c = `RD-${randomInt(10000, 99999)}`;
    if (!(await db.reserva.findUnique({ where: { codigo: c } }))) return c;
  }
  return `RD-${Date.now().toString().slice(-7)}`;
}

async function nuevoNumeroFactura() {
  const anio = new Date().getFullYear();
  const n = await db.factura.count({ where: { numero: { startsWith: `FV-${anio}-` } } });
  return `FV-${anio}-${String(n + 1).padStart(6, "0")}`;
}

export function datosReserva(r: { cancha: { nombre: string }; fecha: Date; horaInicio: number; horaFin: number; codigo: string }) {
  return { cancha: r.cancha.nombre, fecha: fechaLarga(r.fecha), franja: franja(r.horaInicio, r.horaFin), codigo: r.codigo };
}

export async function crearReserva(
  u: Usuario,
  d: { canchaId: string; iso: string; hora: number; actividad: string; participantes: number; observaciones?: string }
) {
  await vencerReservas();
  const cfg = await getConfig();
  const cancha = await db.cancha.findUnique({ where: { id: d.canchaId } });
  if (!cancha) throw new ErrorReserva("El escenario no existe.");
  if (d.participantes < 1 || d.participantes > cancha.capacidad) throw new ErrorReserva(`El ${cancha.nombre} recibe hasta ${cancha.capacidad} personas.`);
  const n = ahora();
  if (d.iso > sumarDias(n.iso, cfg.diasAnticipacion - 1)) throw new ErrorReserva(`Solo puedes reservar con ${cfg.diasAnticipacion} días de anticipación.`);
  const fr = (await franjasDelDia(d.canchaId, d.iso, u.id)).find((f) => f.hora === d.hora);
  if (!fr || fr.estado !== "libre") throw new ErrorReserva("Alguien tomó esa franja. Elige otra hora.");
  const delDia = await db.reserva.count({ where: { usuarioId: u.id, fecha: isoAFecha(d.iso), estado: { in: ["confirmada", "pendiente_pago", "en_validacion"] } } });
  if (delDia >= cfg.maxFranjasDia) throw new ErrorReserva(`Puedes reservar hasta ${cfg.maxFranjasDia} franjas por día.`);

  const comunidad = u.tipo === "comunidad";
  const codigo = await nuevoCodigo();
  const limite = new Date(Math.min(Date.now() + cfg.horasParaPagar * 3600_000, inicioFranja(d.iso, d.hora).getTime() - 3600_000));
  try {
    const reserva = await db.$transaction(async (tx) => {
      const r = await tx.reserva.create({
        data: {
          codigo, usuarioId: u.id, canchaId: d.canchaId, fecha: isoAFecha(d.iso), horaInicio: d.hora, horaFin: d.hora + 1,
          actividad: d.actividad, participantes: d.participantes, observaciones: d.observaciones || null,
          estado: comunidad ? "confirmada" : "pendiente_pago", limitePago: comunidad ? null : limite,
        },
        include: { cancha: true },
      });
      if (!comunidad) {
        const valor = cancha.tarifaHora;
        const iva = Math.round((valor * cfg.ivaPorcentaje) / 100);
        await tx.factura.create({ data: { reservaId: r.id, numero: await nuevoNumeroFactura(), valor, iva, total: valor + iva, venceEn: limite } });
      }
      return tx.reserva.findUniqueOrThrow({ where: { id: r.id }, include: { cancha: true, factura: true } });
    });
    const dr = datosReserva(reserva);
    if (comunidad) {
      await notificar(u.id, "confirmada", "Reserva confirmada", `${dr.cancha}, ${dr.fecha}, ${dr.franja}.`, `/portal/reservas/${codigo}`);
      await enviarCorreo(u.correo, { tipo: "reserva_confirmada", nombre: u.nombres, reserva: dr, qrSrc: await qrDataUrl(codigo) });
    } else {
      await notificar(u.id, "factura", "Factura generada", `Paga ${reserva.factura!.numero} antes del ${fechaHora(limite)}.`, `/pago/${reserva.factura!.id}`);
      await enviarCorreo(u.correo, { tipo: "factura_generada", nombre: u.nombres, reserva: dr, numero: reserva.factura!.numero, total: reserva.factura!.total, limite: fechaHora(limite), facturaId: reserva.factura!.id });
    }
    await auditar(u.correo, u.tipo, "crear_reserva", "reservas", reserva.id, `${dr.cancha} ${fechaAIso(reserva.fecha)} ${d.hora}:00`);
    return reserva;
  } catch (e) {
    if (e instanceof Error && /Unique constraint|reservas_franja_activa_unica|P2002/.test(e.message)) throw new ErrorReserva("Alguien tomó esa franja hace un momento. Elige otra hora.");
    throw e;
  }
}

export async function cancelarReserva(id: string, actor: { correo: string; rol: string; nombre: string }, motivo: string, porBienestar: boolean) {
  const r = await db.reserva.findUnique({ where: { id }, include: { cancha: true, usuario: true, factura: true } });
  if (!r) throw new ErrorReserva("La reserva no existe.");
  if (!["confirmada", "pendiente_pago", "en_validacion"].includes(r.estado)) throw new ErrorReserva("Esta reserva ya no se puede cancelar.");
  await db.$transaction([
    db.reserva.update({ where: { id }, data: { estado: "cancelada", motivoCancelacion: motivo, canceladaPor: porBienestar ? `Bienestar: ${actor.nombre}` : "Usuario" } }),
    ...(r.factura && r.factura.estado === "sin_pagar" ? [db.factura.update({ where: { id: r.factura.id }, data: { estado: "anulada" } })] : []),
  ]);
  const dr = datosReserva(r);
  if (porBienestar) await notificar(r.usuarioId, "cancelacion", "Bienestar canceló tu reserva", `${dr.cancha}, ${dr.fecha}. Motivo: ${motivo}`, `/portal/reservas/${r.codigo}`);
  await enviarCorreo(r.usuario.correo, { tipo: "reserva_cancelada", nombre: r.usuario.nombres, reserva: dr, motivo, porBienestar });
  await auditar(actor.correo, actor.rol, "cancelar_reserva", "reservas", r.id, motivo);
}

/** Registra un pago del usuario (pasarela o comprobante) y lo envía a Tesorería */
export async function registrarPago(
  facturaId: string,
  u: Usuario,
  d: { metodo: MetodoPago; referencia?: string; banco?: string; comprobanteUrl?: string; valor?: number; fechaPago?: string; estado?: "pendiente" | "en_validacion" }
) {
  const f = await db.factura.findUnique({ where: { id: facturaId }, include: { reserva: { include: { cancha: true } } } });
  if (!f || f.reserva.usuarioId !== u.id) throw new ErrorReserva("La factura no existe.");
  if (f.estado !== "sin_pagar") throw new ErrorReserva("Esta factura ya no admite pagos.");
  if (!["pendiente_pago", "rechazada", "en_validacion"].includes(f.reserva.estado)) throw new ErrorReserva("La reserva ya no admite pagos.");
  const estado = d.estado ?? "en_validacion";
  const pago = await db.$transaction(async (tx) => {
    const p = await tx.pago.create({
      data: { facturaId, metodo: d.metodo, referencia: d.referencia, banco: d.banco, comprobanteUrl: d.comprobanteUrl, valor: d.valor ?? f.total, fechaPago: d.fechaPago ? isoAFecha(d.fechaPago) : new Date(), estado },
    });
    if (estado === "en_validacion") await tx.reserva.update({ where: { id: f.reservaId }, data: { estado: "en_validacion" } });
    return p;
  });
  if (estado === "en_validacion") {
    await notificar(u.id, "pago_recibido", "Recibimos tu pago", `Tesorería validará el pago de ${f.numero} en menos de 1 día hábil.`, `/portal/reservas/${f.reserva.codigo}`);
    await enviarCorreo(u.correo, { tipo: "pago_recibido", nombre: u.nombres, numero: f.numero, metodo: METODOS[d.metodo].toLowerCase(), valor: pago.valor });
  }
  await auditar(u.correo, u.tipo, "registrar_pago", "pagos", pago.id, `${f.numero} ${d.metodo}`);
  return pago;
}

export async function validarPago(pagoId: string, p: Personal) {
  const pago = await db.pago.findUnique({ where: { id: pagoId }, include: { factura: { include: { reserva: { include: { cancha: true, usuario: true } } } } } });
  if (!pago || pago.estado !== "en_validacion") throw new ErrorReserva("Este pago ya fue revisado.");
  const r = pago.factura.reserva;
  await db.$transaction([
    db.pago.update({ where: { id: pagoId }, data: { estado: "validado", validadoPorId: p.id, validadoEn: new Date() } }),
    db.factura.update({ where: { id: pago.facturaId }, data: { estado: "pagada" } }),
    db.reserva.update({ where: { id: r.id }, data: { estado: "confirmada", limitePago: null } }),
  ]);
  const dr = datosReserva(r);
  await notificar(r.usuarioId, "pago_aprobado", "Pago aprobado: reserva confirmada", `${dr.cancha}, ${dr.fecha}, ${dr.franja}.`, `/portal/reservas/${r.codigo}`);
  await enviarCorreo(r.usuario.correo, { tipo: "pago_aprobado", nombre: r.usuario.nombres, reserva: dr, qrSrc: await qrDataUrl(r.codigo) });
  await auditar(p.correo, p.rol, "validar_pago", "pagos", pagoId, pago.factura.numero);
}

export async function rechazarPago(pagoId: string, p: Personal, motivo: string) {
  const pago = await db.pago.findUnique({ where: { id: pagoId }, include: { factura: { include: { reserva: { include: { cancha: true, usuario: true } } } } } });
  if (!pago || pago.estado !== "en_validacion") throw new ErrorReserva("Este pago ya fue revisado.");
  const r = pago.factura.reserva;
  await db.$transaction([
    db.pago.update({ where: { id: pagoId }, data: { estado: "rechazado", validadoPorId: p.id, validadoEn: new Date(), motivoRechazo: motivo } }),
    db.reserva.update({ where: { id: r.id }, data: { estado: "rechazada" } }),
  ]);
  await notificar(r.usuarioId, "pago_rechazado", "Pago rechazado", motivo, `/portal/reservas/${r.codigo}`);
  await enviarCorreo(r.usuario.correo, { tipo: "pago_rechazado", nombre: r.usuario.nombres, numero: pago.factura.numero, motivo, facturaId: pago.facturaId });
  await auditar(p.correo, p.rol, "rechazar_pago", "pagos", pagoId, motivo);
}

/** Pago en caja registrado por Tesorería: queda validado de inmediato */
export async function pagoEnCaja(facturaNumero: string, p: Personal, referencia: string, valor: number) {
  const f = await db.factura.findUnique({ where: { numero: facturaNumero }, include: { reserva: { include: { cancha: true, usuario: true } } } });
  if (!f) throw new ErrorReserva("No encontramos una factura con ese número.");
  if (f.estado !== "sin_pagar") throw new ErrorReserva(`La factura ${f.numero} está ${f.estado.replace("_", " ")}.`);
  if (valor !== f.total) throw new ErrorReserva(`El valor debe ser igual al total de la factura.`);
  const pago = await db.pago.create({ data: { facturaId: f.id, metodo: "caja", referencia, valor, fechaPago: new Date(), estado: "en_validacion" } });
  await validarPago(pago.id, p);
  return f;
}
