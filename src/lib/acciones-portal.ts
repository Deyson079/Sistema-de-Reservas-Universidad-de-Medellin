"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { requireUsuario, hashPassword, verificarPassword, passwordValida, cerrarSesion } from "./auth";
import { crearReserva, cancelarReserva, registrarPago, ErrorReserva } from "./reservas";
import { getConfig, esCorreoInstitucional } from "./config";
import { inicioFranja, fechaAIso } from "./formato";
import { guardarArchivo, validarArchivo } from "./storage";
import { generarCodigo, verificarCodigo } from "./codigos";
import { enviarCorreo } from "./email";
import { auditar } from "./auditoria";
import type { Estado } from "./acciones-auth";

const ok = (t: string) => "ok=" + encodeURIComponent(t);
const err = (t: string) => "err=" + encodeURIComponent(t);

export async function reservar(fd: FormData) {
  const u = await requireUsuario();
  const d = {
    canchaId: String(fd.get("canchaId")), iso: String(fd.get("fecha")), hora: Number(fd.get("hora")),
    actividad: String(fd.get("actividad") || "").slice(0, 80), participantes: Number(fd.get("participantes")), observaciones: String(fd.get("observaciones") || "").slice(0, 500),
  };
  if (u.tipo === "externo" && !u.facturacion) redirect("/portal/perfil?" + err("Completa tus datos de facturación antes de reservar.") + "#facturacion");
  let codigo: string;
  try {
    const r = await crearReserva(u, d);
    codigo = r.codigo;
  } catch (e) {
    if (e instanceof ErrorReserva) {
      const c = await db.cancha.findUnique({ where: { id: d.canchaId } });
      redirect(`/portal/reservar?cancha=${c?.slug ?? ""}&fecha=${d.iso}&${err(e.message)}&sincupo=1`);
    }
    throw e;
  }
  redirect(`/portal/reservas/${codigo}/lista`);
}

export async function cancelarMiReserva(fd: FormData) {
  const u = await requireUsuario();
  const id = String(fd.get("id"));
  const motivo = String(fd.get("motivo") || "").trim() || "Sin motivo";
  const r = await db.reserva.findUnique({ where: { id } });
  if (!r || r.usuarioId !== u.id) redirect("/portal/reservas");
  try {
    await cancelarReserva(id, { correo: u.correo, rol: u.tipo, nombre: u.nombres }, motivo, false);
  } catch (e) {
    if (e instanceof ErrorReserva) redirect(`/portal/reservas/${r.codigo}?${err(e.message)}`);
    throw e;
  }
  redirect(`/portal/reservas/${r.codigo}?${ok("Reserva cancelada. La franja quedó libre.")}`);
}

export async function marcarLeidas() {
  const u = await requireUsuario();
  await db.notificacion.updateMany({ where: { usuarioId: u.id, leida: false }, data: { leida: true } });
  revalidatePath("/portal", "layout");
}

export async function abrirAviso(fd: FormData) {
  const u = await requireUsuario();
  const id = String(fd.get("id"));
  const n = await db.notificacion.findUnique({ where: { id } });
  if (n && n.usuarioId === u.id) {
    await db.notificacion.update({ where: { id }, data: { leida: true } });
    redirect(n.enlace || "/portal/avisos");
  }
  redirect("/portal/avisos");
}

export async function actualizarDatos(_: Estado, fd: FormData): Promise<Estado> {
  const u = await requireUsuario();
  const r = z.object({
    nombres: z.string().trim().min(2, "Escribe tus nombres."),
    apellidos: z.string().trim().optional().default(""),
    celular: z.string().trim().regex(/^3\d{9}$/, "Escribe los 10 dígitos de tu celular."),
    programa: z.string().trim().optional(),
  }).safeParse(Object.fromEntries(fd));
  if (!r.success) return { campos: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  await db.usuario.update({ where: { id: u.id }, data: { nombres: r.data.nombres, apellidos: r.data.apellidos, celular: r.data.celular, programa: r.data.programa || u.programa } });
  revalidatePath("/portal", "layout");
  return { ok: true, tipo: "Datos actualizados." };
}

export async function actualizarFacturacion(_: Estado, fd: FormData): Promise<Estado> {
  const u = await requireUsuario();
  if (u.tipo !== "externo") return { error: "Solo para cuentas de externos." };
  const r = z.object({
    tipoPersona: z.enum(["natural", "juridica"]),
    razonSocial: z.string().trim().min(3, "Escribe el nombre o la razón social."),
    nitCedula: z.string().trim().regex(/^[0-9.\-]{5,15}$/, "Escribe el NIT o la cédula."),
    direccion: z.string().trim().min(5, "Escribe la dirección."),
    ciudad: z.string().trim().min(3, "Escribe la ciudad."),
  }).safeParse(Object.fromEntries(fd));
  if (!r.success) return { campos: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  let rutUrl = u.facturacion?.rutUrl ?? null;
  const rut = fd.get("rut") as File | null;
  if (rut && rut.size > 0) {
    const e = validarArchivo(rut, true);
    if (e) return { campos: { rut: e } };
    rutUrl = await guardarArchivo(rut, "rut");
  }
  await db.datosFacturacion.upsert({ where: { usuarioId: u.id }, create: { usuarioId: u.id, ...r.data, rutUrl }, update: { ...r.data, rutUrl } });
  await auditar(u.correo, u.tipo, "actualizar_facturacion", "datos_facturacion", u.id);
  revalidatePath("/portal/perfil");
  return { ok: true, tipo: "Datos de facturación guardados." };
}

export async function cambiarPassword(_: Estado, fd: FormData): Promise<Estado> {
  const u = await requireUsuario();
  const actual = String(fd.get("actual") || ""), nueva = String(fd.get("password") || ""), conf = String(fd.get("confirmar") || "");
  if (!(await verificarPassword(actual, u.passwordHash))) return { campos: { actual: "La contraseña actual no coincide." } };
  if (!passwordValida(nueva)) return { campos: { password: "Necesita 8 caracteres, una mayúscula y un número." } };
  if (nueva !== conf) return { campos: { confirmar: "Las contraseñas no coinciden." } };
  await db.usuario.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(nueva) } });
  await auditar(u.correo, u.tipo, "cambiar_contrasena", "usuarios", u.id);
  return { ok: true, tipo: "Contraseña actualizada." };
}

export async function solicitarCambioCorreo(_: Estado, fd: FormData): Promise<Estado> {
  const u = await requireUsuario();
  const nuevo = String(fd.get("nuevo") || "").trim().toLowerCase();
  if (!z.string().email().safeParse(nuevo).success) return { campos: { nuevo: "Escribe un correo válido." } };
  const cfg = await getConfig();
  const inst = esCorreoInstitucional(nuevo, cfg.dominios);
  if (u.tipo === "comunidad" && !inst) return { campos: { nuevo: "Tu cuenta de comunidad necesita un correo institucional." } };
  if (u.tipo === "externo" && inst) return { campos: { nuevo: "Con un correo institucional debes crear una cuenta de comunidad." } };
  if (await db.usuario.findUnique({ where: { correo: nuevo } })) return { campos: { nuevo: "Ya hay una cuenta con ese correo." } };
  const { codigo } = await generarCodigo(nuevo, "cambio_correo");
  await enviarCorreo(nuevo, { tipo: "codigo_verificacion", nombre: u.nombres.split(" ")[0]!, codigo });
  return { ok: true, valores: { nuevo }, tipo: "codigo" };
}

export async function confirmarCambioCorreo(_: Estado, fd: FormData): Promise<Estado> {
  const u = await requireUsuario();
  const nuevo = String(fd.get("nuevo") || "").toLowerCase();
  const { r, restantes } = await verificarCodigo(nuevo, "cambio_correo", String(fd.get("codigo") || ""));
  if (r === "incorrecto") return { error: `El código no coincide. Te quedan ${restantes} intentos.`, valores: { nuevo }, tipo: "codigo" };
  if (r !== "ok") return { error: "El código venció. Pide uno nuevo.", valores: { nuevo }, tipo: "codigo" };
  await db.usuario.update({ where: { id: u.id }, data: { correo: nuevo } });
  await auditar(nuevo, u.tipo, "cambiar_correo", "usuarios", u.id, `Antes: ${u.correo}`);
  revalidatePath("/portal", "layout");
  return { ok: true, tipo: "Correo actualizado." };
}

export async function guardarPreferencias(fd: FormData) {
  const u = await requireUsuario();
  await db.usuario.update({ where: { id: u.id }, data: { preferencias: { correo: fd.get("correo") === "on", recordatorio: fd.get("recordatorio") === "on", promociones: fd.get("promociones") === "on" } } });
  redirect("/portal/perfil?" + ok("Preferencias guardadas.") + "#preferencias");
}

export async function eliminarCuenta(fd: FormData) {
  const u = await requireUsuario();
  if (!(await verificarPassword(String(fd.get("password") || ""), u.passwordHash))) redirect("/portal/perfil?" + err("La contraseña no coincide. No eliminamos la cuenta.") + "#eliminar");
  const activas = await db.reserva.count({ where: { usuarioId: u.id, estado: { in: ["confirmada", "pendiente_pago", "en_validacion"] } } });
  if (activas) redirect("/portal/perfil?" + err(`Tienes ${activas} reservas activas. Cancélalas antes de eliminar la cuenta.`) + "#eliminar");
  await db.usuario.update({ where: { id: u.id }, data: { estado: "eliminado", correo: `eliminado-${u.id}@eliminado.local`, nombres: "Cuenta eliminada", apellidos: "", celular: "0000000000", documento: "0" } });
  await auditar(u.correo, u.tipo, "eliminar_cuenta", "usuarios", u.id);
  await cerrarSesion();
  redirect("/?" + ok("Eliminamos tu cuenta y tus datos personales."));
}

/* ---------- Pagos del usuario (pasarela simulada) ---------- */
async function factura(facturaId: string) {
  const u = await requireUsuario();
  const f = await db.factura.findUnique({ where: { id: facturaId }, include: { reserva: true } });
  if (!f || f.reserva.usuarioId !== u.id) redirect("/portal/pagos");
  return { u, f };
}

function requiereRut(u: Awaited<ReturnType<typeof requireUsuario>>, facturaId: string) {
  if (!u.facturacion?.rutUrl) redirect(`/pago/${facturaId}?${err("Sube tu RUT en PDF antes de tu primer pago.")}&rut=1`);
}

/** Tarjeta: 4242 4242 4242 4242 aprueba; 4000 0000 0000 0002 rechaza (simulación hasta conectar la pasarela real) */
export async function pagarConTarjeta(_: Estado, fd: FormData): Promise<Estado> {
  const facturaId = String(fd.get("facturaId"));
  const { u, f } = await factura(facturaId);
  requiereRut(u, facturaId);
  const num = String(fd.get("numero") || "").replace(/\s/g, "");
  const campos: Record<string, string> = {};
  if (!/^\d{15,16}$/.test(num)) campos.numero = "Escribe los 16 dígitos de la tarjeta.";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(fd.get("vence") || ""))) campos.vence = "Usa el formato MM/AA.";
  if (!/^\d{3,4}$/.test(String(fd.get("cvv") || ""))) campos.cvv = "3 o 4 dígitos.";
  if (String(fd.get("titular") || "").trim().length < 4) campos.titular = "Escribe el nombre como aparece en la tarjeta.";
  if (Object.keys(campos).length) return { campos };
  const ref = `TC-${Date.now().toString().slice(-8)}`;
  if (num.endsWith("0002")) redirect(`/pago/${facturaId}/procesando?r=rechazado&m=tarjeta&ref=${ref}`);
  await registrarPago(f.id, u, { metodo: "tarjeta", referencia: ref, estado: "en_validacion" });
  redirect(`/pago/${facturaId}/procesando?r=aprobado&m=tarjeta&ref=${ref}`);
}

export async function pagarConPse(fd: FormData) {
  const facturaId = String(fd.get("facturaId"));
  const { u, f } = await factura(facturaId);
  requiereRut(u, facturaId);
  const banco = String(fd.get("banco") || "");
  if (!banco) redirect(`/pago/${facturaId}/pse?${err("Elige tu banco.")}`);
  const ref = `PSE-${Date.now().toString().slice(-8)}`;
  await registrarPago(f.id, u, { metodo: "pse", referencia: ref, banco, estado: "pendiente" });
  redirect(`/pago/${facturaId}/procesando?r=pendiente&m=pse&ref=${ref}`);
}

export async function pagarConBilletera(fd: FormData) {
  const facturaId = String(fd.get("facturaId"));
  const { u, f } = await factura(facturaId);
  requiereRut(u, facturaId);
  const metodo = String(fd.get("metodo")) === "daviplata" ? "daviplata" : "nequi";
  const cel = String(fd.get("celular") || "").replace(/\s/g, "");
  if (!/^3\d{9}$/.test(cel)) redirect(`/pago/${facturaId}/billetera?metodo=${metodo}&${err("Escribe el celular de 10 dígitos de tu cuenta.")}`);
  const ref = `${metodo === "nequi" ? "NEQ" : "DVP"}-${Date.now().toString().slice(-8)}`;
  await registrarPago(f.id, u, { metodo, referencia: ref, estado: "en_validacion" });
  redirect(`/pago/${facturaId}/procesando?r=aprobado&m=${metodo}&ref=${ref}`);
}

export async function subirComprobante(_: Estado, fd: FormData): Promise<Estado> {
  const facturaId = String(fd.get("facturaId"));
  const { u, f } = await factura(facturaId);
  requiereRut(u, facturaId);
  const archivo = fd.get("comprobante") as File | null;
  const campos: Record<string, string> = {};
  const e = validarArchivo(archivo);
  if (e) campos.comprobante = e;
  const referencia = String(fd.get("referencia") || "").trim();
  if (referencia.length < 4) campos.referencia = "Escribe el número de referencia o aprobación.";
  const fecha = String(fd.get("fecha") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) campos.fecha = "Elige la fecha del pago.";
  const valor = Number(String(fd.get("valor") || "").replace(/\D/g, ""));
  if (!valor) campos.valor = "Escribe el valor pagado.";
  if (Object.keys(campos).length) return { campos };
  const url = await guardarArchivo(archivo!, "comprobantes");
  try {
    await registrarPago(f.id, u, { metodo: "transferencia", referencia, comprobanteUrl: url, valor, fechaPago: fecha, estado: "en_validacion" });
  } catch (x) {
    if (x instanceof ErrorReserva) return { error: x.message };
    throw x;
  }
  redirect(`/portal/reservas/${f.reserva.codigo}?${ok("Comprobante enviado. Tesorería lo revisará en menos de 1 día hábil.")}`);
}

/** Simulación del retorno de PSE: confirma el pago pendiente y lo envía a Tesorería */
export async function confirmarPse(fd: FormData) {
  const facturaId = String(fd.get("facturaId"));
  const { u, f } = await factura(facturaId);
  const p = await db.pago.findFirst({ where: { facturaId: f.id, metodo: "pse", estado: "pendiente" }, orderBy: { fecha: "desc" } });
  if (p) {
    await db.$transaction([db.pago.update({ where: { id: p.id }, data: { estado: "en_validacion" } }), db.reserva.update({ where: { id: f.reservaId }, data: { estado: "en_validacion" } })]);
    await auditar(u.correo, u.tipo, "pse_confirmado", "pagos", p.id);
  }
  redirect(`/pago/${facturaId}/resultado?r=aprobado&m=pse&ref=${p?.referencia ?? ""}`);
}

export async function puedeCancelarSinPenalidad(fecha: Date, hora: number) {
  const cfg = await getConfig();
  return inicioFranja(fechaAIso(fecha), hora).getTime() - Date.now() > cfg.horasCancelacion * 3600_000;
}

export async function subirRut(_: Estado, fd: FormData): Promise<Estado> {
  const u = await requireUsuario();
  const rut = fd.get("rut") as File | null;
  const e = validarArchivo(rut, true);
  if (e) return { campos: { rut: e } };
  if (!u.facturacion) return { error: "Completa primero tus datos de facturación en Mi perfil." };
  const url = await guardarArchivo(rut!, "rut");
  await db.datosFacturacion.update({ where: { usuarioId: u.id }, data: { rutUrl: url } });
  await auditar(u.correo, u.tipo, "subir_rut", "datos_facturacion", u.id);
  redirect(String(fd.get("volver") || "/portal/perfil") + "?ok=" + encodeURIComponent("RUT cargado. Ya puedes pagar."));
}
