"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import { getConfig, esCorreoInstitucional } from "./config";
import { cerrarSesion, fijarRecordar, passwordValida } from "./auth";
import { enviarCodigo, puedeReenviar, verificarCodigo } from "./codigos";
import { enviarCorreo } from "./email";
import { guardarArchivo, validarArchivo } from "./storage";
import { auditar } from "./auditoria";
import { firmar, leer } from "./sesion-token";
import { CuentaOcupada, guardarCuentaAuth } from "./supabase/cuentas";
import { supabaseServidor } from "./supabase/servidor";

export type Estado = { error?: string; campos?: Record<string, string>; valores?: Record<string, string>; ok?: boolean; tipo?: string; espera?: number; redir?: string } | undefined;

const val = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
const errores = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
const PASS = "La contraseña necesita 8 caracteres, una mayúscula y un número.";
const OCUPADO = "Ya hay una cuenta con este correo. Ingresa o recupera tu contraseña.";
const seguro = () => process.env.NODE_ENV === "production";

const base = {
  correo: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  celular: z.string().trim().regex(/^3\d{9}$/, "Escribe los 10 dígitos de tu celular, sin espacios."),
  password: z.string().refine(passwordValida, PASS),
  confirmar: z.string(),
  terminos: z.literal("on", { message: "Debes aceptar los términos y la política de datos." }),
};

type DatosUsuario = Parameters<typeof db.usuario.create>[0]["data"] & { correo: string; nombres: string; tipo: "comunidad" | "externo" };

/** Guarda la fila del usuario, crea o actualiza su cuenta en Supabase Auth (sin confirmar) y envía el código. */
async function crearCuentaUsuario(existe: { id: string } | null, datos: DatosUsuario, password: string, valores: Record<string, string>): Promise<Estado> {
  const fila = existe
    ? await db.usuario.update({ where: { id: existe.id }, data: datos as Parameters<typeof db.usuario.update>[0]["data"] })
    : await db.usuario.create({ data: datos });
  try {
    const authId = await guardarCuentaAuth({ authId: fila.authId, correo: datos.correo, password, meta: { k: "u", rol: datos.tipo, ref: fila.id, nombre: datos.nombres } });
    if (authId !== fila.authId) await db.usuario.update({ where: { id: fila.id }, data: { authId } });
  } catch (e) {
    if (!existe) await db.usuario.delete({ where: { id: fila.id } });
    if (e instanceof CuentaOcupada) return { campos: { correo: OCUPADO }, valores };
    console.error("[registro]", e);
    return { error: "No pudimos crear la cuenta en este momento. Intenta de nuevo en unos minutos.", valores };
  }
  const env = await enviarCodigo(datos.correo, "registro");
  if (!env.ok && !env.espera) return { error: env.error, valores };
  redirect(`/verificar?correo=${encodeURIComponent(datos.correo)}`);
}

export async function registrarComunidad(_: Estado, fd: FormData): Promise<Estado> {
  const v = val(fd);
  const r = z.object({
    nombres: z.string().trim().min(2, "Escribe tus nombres."),
    apellidos: z.string().trim().min(2, "Escribe tus apellidos."),
    tipoDocumento: z.enum(["CC", "TI", "CE", "PA"]),
    documento: z.string().trim().regex(/^[0-9A-Za-z]{5,15}$/, "Escribe tu número de documento sin puntos."),
    rol: z.enum(["estudiante", "docente", "administrativo", "egresado"], { message: "Elige tu rol." }),
    programa: z.string().trim().min(2, "Escribe tu programa o dependencia."),
    ...base,
  }).refine((d) => d.password === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden." }).safeParse(v);
  if (!r.success) return { campos: errores(r.error), valores: v };
  const cfg = await getConfig();
  if (!esCorreoInstitucional(r.data.correo, cfg.dominios)) return { campos: { correo: `Usa tu correo ${cfg.dominios.map((d) => "@" + d).join(" o ")}. Si no tienes uno, crea una cuenta de externo.` }, valores: v };
  const existe = await db.usuario.findUnique({ where: { correo: r.data.correo } });
  if (existe && existe.correoVerificado) return { campos: { correo: OCUPADO }, valores: v };
  const data = { tipo: "comunidad" as const, rol: r.data.rol, nombres: r.data.nombres, apellidos: r.data.apellidos, tipoDocumento: r.data.tipoDocumento, documento: r.data.documento, correo: r.data.correo, celular: r.data.celular, programa: r.data.programa };
  return crearCuentaUsuario(existe, data, r.data.password, v);
}

export async function registrarExterno(_: Estado, fd: FormData): Promise<Estado> {
  const v = val(fd);
  const r = z.object({
    tipoPersona: z.enum(["natural", "juridica"]),
    nombre: z.string().trim().min(3, "Escribe tu nombre completo o la razón social."),
    nitCedula: z.string().trim().regex(/^[0-9.\-]{5,15}$/, "Escribe el NIT o la cédula, solo números, puntos o guion."),
    direccion: z.string().trim().min(5, "Escribe la dirección de facturación."),
    ciudad: z.string().trim().min(3, "Escribe la ciudad."),
    ...base,
  }).refine((d) => d.password === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden." }).safeParse(v);
  if (!r.success) return { campos: errores(r.error), valores: v };
  const cfg = await getConfig();
  if (esCorreoInstitucional(r.data.correo, cfg.dominios)) return { campos: { correo: "Este es un correo institucional: crea una cuenta de comunidad y no pagarás reservas." }, valores: v };
  const existe = await db.usuario.findUnique({ where: { correo: r.data.correo } });
  if (existe && existe.correoVerificado) return { campos: { correo: OCUPADO }, valores: v };
  const rut = fd.get("rut") as File | null;
  let rutUrl: string | null = null;
  if (rut && rut.size > 0) {
    const e = validarArchivo(rut, true);
    if (e) return { campos: { rut: e }, valores: v };
    rutUrl = await guardarArchivo(rut, "rut");
  }
  const juridica = r.data.tipoPersona === "juridica";
  const fact = { tipoPersona: r.data.tipoPersona, nitCedula: r.data.nitCedula, razonSocial: r.data.nombre, direccion: r.data.direccion, ciudad: r.data.ciudad, rutUrl };
  const data = {
    tipo: "externo" as const, rol: "externo" as const, nombres: r.data.nombre, apellidos: "", tipoDocumento: juridica ? "NIT" : "CC", documento: r.data.nitCedula, correo: r.data.correo, celular: r.data.celular,
    facturacion: (existe ? { upsert: { create: fact, update: fact } } : { create: fact }) as { create: typeof fact },
  };
  return crearCuentaUsuario(existe, data, r.data.password, v);
}

export async function verificarRegistro(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const codigo = String(fd.get("codigo") || "");
  if (!/^\d{6}$/.test(codigo)) return { error: "Escribe los 6 dígitos del código.", tipo: "incompleto" };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (!u) return { error: "No encontramos una cuenta con este correo.", tipo: "incorrecto" };
  await fijarRecordar(false);
  const { r, restantes } = await verificarCodigo(correo, "registro", codigo); // si es correcto, Supabase abre la sesión
  if (r === "vencido") return { error: "El código venció. Pide uno nuevo.", tipo: "vencido" };
  if (r === "agotado") return { error: "Superaste los intentos permitidos. Pide un código nuevo.", tipo: "vencido" };
  if (r === "inexistente") return { error: "Este código ya no es válido. Pide uno nuevo.", tipo: "vencido" };
  if (r === "incorrecto") return { error: `El código no coincide. Te quedan ${restantes} intentos.`, tipo: "incorrecto" };
  await db.usuario.update({ where: { id: u.id }, data: { correoVerificado: true } });
  await enviarCorreo(u.correo, { tipo: "bienvenida", nombre: u.nombres.split(" ")[0]!, comunidad: u.tipo === "comunidad" });
  await auditar(u.correo, u.tipo, "verificar_correo", "usuarios", u.id);
  return { ok: true, redir: "/portal?ok=" + encodeURIComponent("Cuenta verificada. ¡Bienvenido!") };
}

export async function reenviarCodigo(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const tipo = (String(fd.get("tipoCodigo") || "registro")) as "registro" | "recuperacion";
  const p = await puedeReenviar(correo, tipo);
  if (!p.ok) return { error: `Espera ${p.espera} segundos para pedir otro código.`, espera: p.espera };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && u.estado !== "eliminado" && u.authId) {
    const env = await enviarCodigo(correo, tipo);
    if (!env.ok) return { error: env.error, espera: env.espera };
  }
  redirect(`${tipo === "registro" ? "/verificar" : "/recuperar/codigo"}?correo=${encodeURIComponent(correo)}&reenviado=1`);
}

export async function cambiarCorreoRegistro(_: Estado, fd: FormData): Promise<Estado> {
  const actual = String(fd.get("correo") || "").toLowerCase();
  const nuevo = String(fd.get("nuevo") || "").trim().toLowerCase();
  if (!z.string().email().safeParse(nuevo).success) return { error: "Escribe un correo válido." };
  const u = await db.usuario.findUnique({ where: { correo: actual } });
  if (!u || u.correoVerificado) return { error: "No se puede cambiar este correo." };
  const cfg = await getConfig();
  const inst = esCorreoInstitucional(nuevo, cfg.dominios);
  if (u.tipo === "comunidad" && !inst) return { error: "Para una cuenta de comunidad, usa tu correo institucional." };
  if (u.tipo === "externo" && inst) return { error: "Ese es un correo institucional: crea una cuenta de comunidad." };
  if (await db.usuario.findUnique({ where: { correo: nuevo } })) return { error: "Ya hay una cuenta con ese correo." };
  try {
    const authId = await guardarCuentaAuth({ authId: u.authId, correo: nuevo, meta: { k: "u", rol: u.tipo, ref: u.id, nombre: u.nombres } });
    await db.usuario.update({ where: { id: u.id }, data: { correo: nuevo, authId } });
  } catch (e) {
    if (e instanceof CuentaOcupada) return { error: "Ya hay una cuenta con ese correo." };
    console.error("[cambiar correo registro]", e);
    return { error: "No pudimos cambiar el correo. Intenta de nuevo." };
  }
  const env = await enviarCodigo(nuevo, "registro");
  if (!env.ok && !env.espera) return { error: env.error };
  redirect(`/verificar?correo=${encodeURIComponent(nuevo)}`);
}

export async function ingresar(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const siguiente = String(fd.get("siguiente") || "");
  const recordar = fd.get("recordar") === "on";
  const valores = { correo };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && u.bloqueadoHasta && u.bloqueadoHasta > new Date()) {
    const min = Math.ceil((u.bloqueadoHasta.getTime() - Date.now()) / 60000);
    return { tipo: "bloqueada", error: `Tu cuenta está bloqueada por seguridad durante ${min} minutos más, por varios intentos fallidos. También puedes cambiar tu contraseña.`, valores };
  }
  const fallo = async (): Promise<Estado> => {
    if (u) {
      const n = u.intentosFallidos + 1;
      await db.usuario.update({ where: { id: u.id }, data: { intentosFallidos: n >= 5 ? 0 : n, bloqueadoHasta: n >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
      if (n >= 5) return { tipo: "bloqueada", error: "Bloqueamos tu cuenta durante 15 minutos por 5 intentos fallidos. Puedes esperar o cambiar tu contraseña.", valores };
    }
    return { tipo: "credenciales", error: "El correo o la contraseña no coinciden. Revisa e intenta de nuevo.", valores };
  };
  // Solo cuentas de usuarios: el personal entra por /personal
  if (!u || u.estado === "eliminado" || !u.authId) return fallo();
  await fijarRecordar(recordar);
  const sb = await supabaseServidor({ recordar });
  const { data, error } = await sb.auth.signInWithPassword({ email: correo, password });
  if (error?.code === "email_not_confirmed") return { tipo: "sin_verificar", error: "Aún no has verificado tu correo. Te enviamos un código para activarla.", valores };
  if (error || !data.user) return fallo();
  if ((data.user.app_metadata as { k?: string }).k !== "u" || data.user.id !== u.authId) {
    await sb.auth.signOut({ scope: "local" });
    return fallo();
  }
  await db.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
  redirect(siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/portal");
}

export async function verificarAhora(fd: FormData) {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && !u.correoVerificado && u.authId && (await puedeReenviar(correo, "registro")).ok) await enviarCodigo(correo, "registro");
  redirect(`/verificar?correo=${encodeURIComponent(correo)}`);
}

export async function recuperarPaso1(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  if (!z.string().email().safeParse(correo).success) return { campos: { correo: "Escribe un correo válido." }, valores: { correo } };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && u.estado !== "eliminado" && u.authId) {
    const p = await puedeReenviar(correo, "recuperacion");
    if (p.ok) await enviarCodigo(correo, "recuperacion");
  }
  redirect(`/recuperar/codigo?correo=${encodeURIComponent(correo)}`);
}

export async function recuperarPaso2(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const codigo = String(fd.get("codigo") || "");
  if (!/^\d{6}$/.test(codigo)) return { error: "Escribe los 6 dígitos del código.", tipo: "incompleto" };
  await fijarRecordar(false);
  const { r, restantes } = await verificarCodigo(correo, "recuperacion", codigo); // abre una sesión de recuperación en Supabase
  if (r === "incorrecto") return { error: `El código no coincide. Te quedan ${restantes} intentos.`, tipo: "incorrecto" };
  if (r !== "ok") return { error: "El código venció o ya no es válido. Pide uno nuevo.", tipo: "vencido" };
  (await cookies()).set("udem_rec", await firmar({ sub: correo, k: "u", rol: "recuperacion", nombre: "" }, 1), { httpOnly: true, sameSite: "lax", path: "/recuperar", maxAge: 900, secure: seguro() });
  redirect("/recuperar/nueva");
}

export async function recuperarPaso3(_: Estado, fd: FormData): Promise<Estado> {
  const t = await leer((await cookies()).get("udem_rec")?.value);
  if (!t || t.rol !== "recuperacion") return { error: "La solicitud venció. Empieza de nuevo." };
  const p = String(fd.get("password") || ""), c = String(fd.get("confirmar") || "");
  if (!passwordValida(p)) return { campos: { password: PASS } };
  if (p !== c) return { campos: { confirmar: "Las contraseñas no coinciden." } };
  const sb = await supabaseServidor();
  const { data } = await sb.auth.getClaims();
  if (!data?.claims || String(data.claims.email ?? "").toLowerCase() !== t.sub) return { error: "La solicitud venció. Empieza de nuevo." };
  const { error } = await sb.auth.updateUser({ password: p });
  if (error?.code === "same_password") return { campos: { password: "Elige una contraseña distinta a la anterior." } };
  if (error) {
    console.error("[recuperar]", error.code, error.message);
    return { error: "No pudimos guardar la contraseña. Empieza de nuevo." };
  }
  const u = await db.usuario.update({ where: { correo: t.sub }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
  (await cookies()).delete({ name: "udem_rec", path: "/recuperar" });
  await cerrarSesion("global"); // cierra la sesión de recuperación y cualquier otra abierta con la contraseña anterior
  await auditar(u.correo, u.tipo, "cambiar_contrasena", "usuarios", u.id, "Recuperación");
  redirect("/recuperar/listo");
}

export async function ingresarPersonal(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const valores = { correo };
  const fallo = async (): Promise<Estado> => {
    await auditar(correo || "desconocido", "desconocido", "ingreso_fallido", "personal");
    return { error: "El correo o la contraseña no coinciden.", valores };
  };
  if (!correo || !password) return { error: "Escribe tu correo y tu contraseña.", valores };
  const p = await db.personal.findUnique({ where: { correo } });
  if (!p || !p.activo || !p.authId) return fallo();
  // La sesión del personal no se recuerda: termina al cerrar el navegador
  await fijarRecordar(false);
  const sb = await supabaseServidor({ recordar: false });
  const { data, error } = await sb.auth.signInWithPassword({ email: correo, password });
  if (error || !data.user) return fallo();
  if ((data.user.app_metadata as { k?: string }).k !== "p" || data.user.id !== p.authId) {
    await sb.auth.signOut({ scope: "local" });
    return fallo();
  }
  await Promise.all([
    db.personal.update({ where: { id: p.id }, data: { ultimoIngreso: new Date() } }),
    auditar(p.correo, p.rol, "ingreso", "personal", p.id),
  ]);
  redirect(p.rol === "tesoreria" ? "/tesoreria" : p.rol === "bienestar" ? "/bienestar" : "/admin");
}

export async function salir() {
  await cerrarSesion();
  redirect("/?ok=" + encodeURIComponent("Cerraste sesión."));
}
