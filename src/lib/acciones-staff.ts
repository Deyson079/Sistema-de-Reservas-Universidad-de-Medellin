"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { requirePersonal, hashPassword } from "./auth";
import { validarPago, rechazarPago, pagoEnCaja, cancelarReserva, ErrorReserva } from "./reservas";
import { setConfig, type Config } from "./config";
import { auditar } from "./auditoria";
import { inicioFranja } from "./formato";
import { notificar } from "./notificar";
import type { Estado } from "./acciones-auth";

const q = (k: "ok" | "err", t: string) => `${k}=${encodeURIComponent(t)}`;

/* ---------- Tesorería ---------- */
export async function validar(fd: FormData) {
  const p = await requirePersonal(["tesoreria"]);
  const id = String(fd.get("pagoId"));
  const volver = String(fd.get("volver") || "/tesoreria/pagos");
  try { await validarPago(id, p); } catch (e) { if (e instanceof ErrorReserva) redirect(`${volver}${volver.includes("?") ? "&" : "?"}${q("err", e.message)}`); throw e; }
  revalidatePath("/tesoreria", "layout");
  redirect(`${volver}${volver.includes("?") ? "&" : "?"}${q("ok", "Pago validado. La reserva quedó confirmada y avisamos al cliente.")}`);
}

export async function rechazar(fd: FormData) {
  const p = await requirePersonal(["tesoreria"]);
  const id = String(fd.get("pagoId"));
  const volver = String(fd.get("volver") || "/tesoreria/pagos");
  const motivo = String(fd.get("motivo") || "").trim();
  const detalle = String(fd.get("detalle") || "").trim();
  const texto = [motivo, detalle].filter(Boolean).join(". ");
  if (texto.length < 8) redirect(`/tesoreria/pagos?ver=${id}&${q("err", "Escribe el motivo del rechazo: el cliente lo verá.")}`);
  try { await rechazarPago(id, p, texto); } catch (e) { if (e instanceof ErrorReserva) redirect(`${volver}?${q("err", e.message)}`); throw e; }
  revalidatePath("/tesoreria", "layout");
  redirect(`${volver}${volver.includes("?") ? "&" : "?"}${q("ok", "Pago rechazado. Avisamos al cliente con el motivo.")}`);
}

export async function registrarCaja(_: Estado, fd: FormData): Promise<Estado> {
  const p = await requirePersonal(["tesoreria"]);
  const numero = String(fd.get("numero") || "").trim().toUpperCase();
  const referencia = String(fd.get("referencia") || "").trim();
  const valor = Number(String(fd.get("valor") || "").replace(/\D/g, ""));
  if (!numero) return { campos: { numero: "Escribe el número de factura." } };
  if (referencia.length < 3) return { campos: { referencia: "Escribe el número del recibo de caja." }, valores: { numero } };
  try { await pagoEnCaja(numero, p, referencia, valor); } catch (e) { if (e instanceof ErrorReserva) return { error: e.message, valores: { numero, referencia } }; throw e; }
  revalidatePath("/tesoreria", "layout");
  return { ok: true, tipo: `Pago registrado en caja para la factura ${numero}. La reserva quedó confirmada.` };
}

/* ---------- Bienestar ---------- */
export async function cancelarPorBienestar(fd: FormData) {
  const p = await requirePersonal(["bienestar"]);
  const id = String(fd.get("id"));
  const motivo = [String(fd.get("motivo") || ""), String(fd.get("detalle") || "")].filter(Boolean).join(". ").trim();
  const r = await db.reserva.findUnique({ where: { id } });
  if (!r) redirect("/bienestar/reservas");
  if (motivo.length < 5) redirect(`/bienestar/reservas/${r.codigo}?${q("err", "Escribe el motivo: le llega al usuario.")}`);
  try { await cancelarReserva(id, { correo: p.correo, rol: p.rol, nombre: p.nombre }, motivo, true); } catch (e) { if (e instanceof ErrorReserva) redirect(`/bienestar/reservas/${r.codigo}?${q("err", e.message)}`); throw e; }
  redirect(`/bienestar/reservas/${r.codigo}?${q("ok", "Reserva cancelada. Avisamos al usuario por correo y en Avisos.")}`);
}

export async function marcarAsistencia(fd: FormData) {
  const p = await requirePersonal(["bienestar"]);
  const id = String(fd.get("id"));
  const asistio = fd.get("asistio") === "si";
  const r = await db.reserva.findUnique({ where: { id } });
  if (!r) redirect("/bienestar/reservas");
  if (!["confirmada", "asistio", "no_asistio"].includes(r.estado)) redirect(`/bienestar/reservas/${r.codigo}?${q("err", "Solo se marca asistencia en reservas confirmadas.")}`);
  if (inicioFranja(r.fecha.toISOString().slice(0, 10), r.horaInicio).getTime() - Date.now() > 30 * 60_000) redirect(`/bienestar/reservas/${r.codigo}?${q("err", "La asistencia se marca desde 30 minutos antes de la franja.")}`);
  await db.reserva.update({ where: { id }, data: { estado: asistio ? "asistio" : "no_asistio" } });
  await auditar(p.correo, p.rol, asistio ? "marcar_asistencia" : "marcar_inasistencia", "reservas", id, r.codigo);
  redirect(`/bienestar/reservas/${r.codigo}?${q("ok", asistio ? "Asistencia registrada." : "Inasistencia registrada.")}`);
}

export async function cambiarEstadoCancha(fd: FormData) {
  const p = await requirePersonal(["bienestar"]);
  const id = String(fd.get("id"));
  const estado = fd.get("estado") === "activa" ? "activa" : "fuera_de_servicio";
  const c = await db.cancha.update({ where: { id }, data: { estado } });
  await auditar(p.correo, p.rol, "cambiar_estado_cancha", "canchas", id, `${c.nombre}: ${estado}`);
  redirect(`/bienestar/canchas?${q("ok", `${c.nombre}: ${estado === "activa" ? "activa" : "fuera de servicio"}.`)}`);
}

export async function crearBloqueo(_: Estado, fd: FormData): Promise<Estado> {
  const p = await requirePersonal(["bienestar"]);
  const r = z.object({
    canchaId: z.string().min(1, "Elige el escenario."),
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha inicial."),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha final."),
    horaDesde: z.coerce.number().min(0).max(23),
    horaHasta: z.coerce.number().min(1).max(24),
    motivo: z.string().trim().min(4, "Escribe el motivo."),
    tipo: z.enum(["mantenimiento", "evento"]),
  }).safeParse(Object.fromEntries(fd));
  if (!r.success) return { campos: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const desde = inicioFranja(r.data.desde, r.data.horaDesde), hasta = inicioFranja(r.data.hasta, r.data.horaHasta);
  if (hasta <= desde) return { campos: { hasta: "La fecha final debe ser posterior a la inicial." } };
  const b = await db.bloqueo.create({ data: { canchaId: r.data.canchaId, desde, hasta, motivo: r.data.motivo, tipo: r.data.tipo, creadoPor: p.nombre }, include: { cancha: true } });
  // Reservas afectadas: se cancelan y se avisa a cada usuario
  const afectadas = (await db.reserva.findMany({ where: { canchaId: b.canchaId, estado: { in: ["confirmada", "pendiente_pago", "en_validacion"] }, fecha: { gte: new Date(r.data.desde + "T00:00:00Z"), lte: new Date(r.data.hasta + "T00:00:00Z") } } }))
    .filter((x) => { const i = inicioFranja(x.fecha.toISOString().slice(0, 10), x.horaInicio); return i >= desde && i < hasta; });
  for (const a of afectadas) await cancelarReserva(a.id, { correo: p.correo, rol: p.rol, nombre: p.nombre }, `${r.data.tipo === "evento" ? "Evento institucional" : "Mantenimiento"}: ${r.data.motivo}`, true);
  await auditar(p.correo, p.rol, "crear_bloqueo", "bloqueos", b.id, `${b.cancha.nombre}: ${r.data.motivo} (${afectadas.length} reservas canceladas)`);
  revalidatePath("/bienestar/canchas");
  return { ok: true, tipo: `Bloqueo creado en ${b.cancha.nombre}. ${afectadas.length ? `Cancelamos ${afectadas.length} reservas y avisamos a los usuarios.` : "No había reservas afectadas."}` };
}

export async function eliminarBloqueo(fd: FormData) {
  const p = await requirePersonal(["bienestar"]);
  const b = await db.bloqueo.delete({ where: { id: String(fd.get("id")) }, include: { cancha: true } });
  await auditar(p.correo, p.rol, "eliminar_bloqueo", "bloqueos", b.id, `${b.cancha.nombre}: ${b.motivo}`);
  redirect(`/bienestar/canchas?${q("ok", "Bloqueo eliminado. Las franjas quedaron libres.")}`);
}

/* ---------- Administrador ---------- */
export async function guardarPersonal(_: Estado, fd: FormData): Promise<Estado> {
  const a = await requirePersonal(["administrador"]);
  const r = z.object({
    id: z.string().optional(),
    nombre: z.string().trim().min(3, "Escribe el nombre completo."),
    correo: z.string().trim().toLowerCase().email("Escribe un correo válido."),
    rol: z.enum(["tesoreria", "bienestar", "administrador"]),
    password: z.string().optional(),
  }).safeParse(Object.fromEntries(fd));
  if (!r.success) return { campos: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const { id, password, ...d } = r.data;
  if (!id && (!password || password.length < 10)) return { campos: { password: "La contraseña temporal necesita al menos 10 caracteres." } };
  const otro = await db.personal.findUnique({ where: { correo: d.correo } });
  if (otro && otro.id !== id) return { campos: { correo: "Ya existe una cuenta del personal con ese correo." } };
  if (id) await db.personal.update({ where: { id }, data: { ...d, ...(password ? { passwordHash: await hashPassword(password) } : {}) } });
  else await db.personal.create({ data: { ...d, passwordHash: await hashPassword(password!) } });
  await auditar(a.correo, a.rol, id ? "editar_personal" : "crear_personal", "personal", id, `${d.nombre} (${d.rol})`);
  revalidatePath("/admin/usuarios");
  return { ok: true, tipo: id ? "Cuenta actualizada." : `Cuenta creada para ${d.nombre}. Comparte la contraseña temporal por un canal seguro.` };
}

export async function activarPersonal(fd: FormData) {
  const a = await requirePersonal(["administrador"]);
  const id = String(fd.get("id"));
  if (id === a.id) redirect(`/admin/usuarios?${q("err", "No puedes desactivar tu propia cuenta.")}`);
  const p = await db.personal.update({ where: { id }, data: { activo: fd.get("activo") === "si" } });
  await auditar(a.correo, a.rol, p.activo ? "activar_personal" : "desactivar_personal", "personal", id, p.nombre);
  redirect(`/admin/usuarios?${q("ok", `${p.nombre}: cuenta ${p.activo ? "activada" : "desactivada"}.`)}`);
}

export async function bloquearUsuario(fd: FormData) {
  const a = await requirePersonal(["administrador"]);
  const id = String(fd.get("id"));
  const u = await db.usuario.update({ where: { id }, data: { estado: fd.get("estado") === "activo" ? "activo" : "bloqueado" } });
  await auditar(a.correo, a.rol, u.estado === "activo" ? "desbloquear_usuario" : "bloquear_usuario", "usuarios", id, u.correo);
  redirect(`/admin/usuarios?tab=usuarios&${q("ok", `${u.nombres}: ${u.estado === "activo" ? "activo" : "bloqueado"}.`)}`);
}

export async function guardarConfiguracion(_: Estado, fd: FormData): Promise<Estado> {
  const a = await requirePersonal(["administrador"]);
  const n = (k: string) => Number(fd.get(k));
  const campos: Record<string, string> = {};
  const horaApertura = n("horaApertura"), horaCierre = n("horaCierre");
  if (!(horaApertura >= 0 && horaCierre <= 24 && horaCierre > horaApertura)) campos.horaCierre = "La hora de cierre debe ser posterior a la de apertura.";
  const dominios = String(fd.get("dominios") || "").split(/[\s,]+/).map((d) => d.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
  if (!dominios.length || dominios.some((d) => !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d))) campos.dominios = "Escribe dominios válidos separados por comas.";
  if (Object.keys(campos).length) return { campos };
  const valores: Partial<Config> = {
    horaApertura, horaCierre, diasAnticipacion: n("diasAnticipacion"), horasParaPagar: n("horasParaPagar"), maxFranjasDia: n("maxFranjasDia"),
    horasCancelacion: n("horasCancelacion"), ivaPorcentaje: n("ivaPorcentaje"), dominios,
    diasServicio: fd.getAll("diasServicio").map(Number),
    datosBancarios: { banco: String(fd.get("banco")), tipoCuenta: String(fd.get("tipoCuenta")), numero: String(fd.get("numero")), titular: String(fd.get("titular")), nit: String(fd.get("nit")), convenio: String(fd.get("convenio")) },
    contacto: { correo: String(fd.get("cCorreo")), telefono: String(fd.get("cTelefono")), direccion: String(fd.get("cDireccion")), horario: String(fd.get("cHorario")) },
  };
  for (const [k, v] of Object.entries(valores)) await setConfig(k as keyof Config, v);
  await auditar(a.correo, a.rol, "actualizar_configuracion", "configuracion", undefined, Object.keys(valores).join(", "));
  revalidatePath("/", "layout");
  return { ok: true, tipo: "Configuración guardada. Los cambios ya aplican en toda la plataforma." };
}

export async function guardarCancha(_: Estado, fd: FormData): Promise<Estado> {
  const a = await requirePersonal(["administrador"]);
  const r = z.object({
    id: z.string().optional(),
    nombre: z.string().trim().min(3, "Escribe el nombre."),
    deportes: z.string().trim().min(3, "Escribe al menos un deporte."),
    capacidad: z.coerce.number().int().min(1, "Mínimo 1 persona."),
    dimensiones: z.string().trim().min(3, "Escribe las medidas."),
    tarifaHora: z.coerce.number().int().min(0, "La tarifa no puede ser negativa."),
    ubicacion: z.string().trim().default(""),
    descripcion: z.string().trim().default(""),
    servicios: z.string().trim().default(""),
    ilustracion: z.enum(["baloncesto", "futbol", "placa", "voleibol"]),
  }).safeParse(Object.fromEntries(fd));
  if (!r.success) return { campos: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const { id, deportes, servicios, ...d } = r.data;
  const data = { ...d, deportes: deportes.split(",").map((x) => x.trim()).filter(Boolean), servicios: servicios.split(",").map((x) => x.trim()).filter(Boolean) };
  const slug = d.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (id) await db.cancha.update({ where: { id }, data });
  else await db.cancha.create({ data: { ...data, slug, fotos: [], orden: await db.cancha.count() } });
  await auditar(a.correo, a.rol, id ? "editar_cancha" : "crear_cancha", "canchas", id, `${d.nombre}, tarifa ${d.tarifaHora}`);
  revalidatePath("/", "layout");
  return { ok: true, tipo: `${d.nombre} guardada.` };
}

export async function avisoMasivo(fd: FormData) {
  const a = await requirePersonal(["administrador"]);
  const titulo = String(fd.get("titulo") || "").trim(), mensaje = String(fd.get("mensaje") || "").trim();
  if (!titulo || !mensaje) redirect(`/admin/configuracion?${q("err", "Escribe título y mensaje.")}`);
  const us = await db.usuario.findMany({ where: { estado: "activo" }, select: { id: true } });
  for (const u of us) await notificar(u.id, "aviso", titulo, mensaje);
  await auditar(a.correo, a.rol, "aviso_masivo", "notificaciones", undefined, titulo);
  redirect(`/admin/configuracion?${q("ok", `Aviso enviado a ${us.length} usuarios.`)}`);
}
