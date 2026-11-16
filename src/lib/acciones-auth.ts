"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import { getConfig, esCorreoInstitucional } from "./config";
import { crearSesion, cerrarSesion, hashPassword, passwordValida, verificarPassword } from "./auth";
import { generarCodigo, puedeReenviar, verificarCodigo } from "./codigos";
import { enviarCorreo } from "./email";
import { guardarArchivo, validarArchivo } from "./storage";
import { auditar } from "./auditoria";
import { firmar, leer } from "./sesion-token";

export type Estado = { error?: string; campos?: Record<string, string>; valores?: Record<string, string>; ok?: boolean; tipo?: string; espera?: number; redir?: string } | undefined;

const val = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
const errores = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
const PASS = "La contraseña necesita 8 caracteres, una mayúscula y un número.";

const base = {
  correo: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  celular: z.string().trim().regex(/^3\d{9}$/, "Escribe los 10 dígitos de tu celular, sin espacios."),
  password: z.string().refine(passwordValida, PASS),
  confirmar: z.string(),
  terminos: z.literal("on", { message: "Debes aceptar los términos y la política de datos." }),
};

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
  if (existe && existe.correoVerificado) return { campos: { correo: "Ya hay una cuenta con este correo. Ingresa o recupera tu contraseña." }, valores: v };
  const data = { tipo: "comunidad" as const, rol: r.data.rol, nombres: r.data.nombres, apellidos: r.data.apellidos, tipoDocumento: r.data.tipoDocumento, documento: r.data.documento, correo: r.data.correo, celular: r.data.celular, programa: r.data.programa, passwordHash: await hashPassword(r.data.password) };
  if (existe) await db.usuario.update({ where: { id: existe.id }, data });
  else await db.usuario.create({ data });
  const { codigo } = await generarCodigo(r.data.correo, "registro");
  await enviarCorreo(r.data.correo, { tipo: "codigo_verificacion", nombre: r.data.nombres.split(" ")[0]!, codigo });
  redirect(`/verificar?correo=${encodeURIComponent(r.data.correo)}`);
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
  if (existe && existe.correoVerificado) return { campos: { correo: "Ya hay una cuenta con este correo. Ingresa o recupera tu contraseña." }, valores: v };
  const rut = fd.get("rut") as File | null;
  let rutUrl: string | null = null;
  if (rut && rut.size > 0) {
    const e = validarArchivo(rut, true);
    if (e) return { campos: { rut: e }, valores: v };
    rutUrl = await guardarArchivo(rut, "rut");
  }
  const juridica = r.data.tipoPersona === "juridica";
  const data = { tipo: "externo" as const, rol: "externo" as const, nombres: r.data.nombre, apellidos: "", tipoDocumento: juridica ? "NIT" : "CC", documento: r.data.nitCedula, correo: r.data.correo, celular: r.data.celular, passwordHash: await hashPassword(r.data.password) };
  const fact = { tipoPersona: r.data.tipoPersona, nitCedula: r.data.nitCedula, razonSocial: r.data.nombre, direccion: r.data.direccion, ciudad: r.data.ciudad, rutUrl };
  if (existe) await db.usuario.update({ where: { id: existe.id }, data: { ...data, facturacion: { upsert: { create: fact, update: fact } } } });
  else await db.usuario.create({ data: { ...data, facturacion: { create: fact } } });
  const { codigo } = await generarCodigo(r.data.correo, "registro");
  await enviarCorreo(r.data.correo, { tipo: "codigo_verificacion", nombre: r.data.nombre.split(" ")[0]!, codigo });
  redirect(`/verificar?correo=${encodeURIComponent(r.data.correo)}`);
}

export async function verificarRegistro(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const codigo = String(fd.get("codigo") || "");
  if (!/^\d{6}$/.test(codigo)) return { error: "Escribe los 6 dígitos del código.", tipo: "incompleto" };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (!u) return { error: "No encontramos una cuenta con este correo.", tipo: "incorrecto" };
  const { r, restantes } = await verificarCodigo(correo, "registro", codigo);
  if (r === "vencido") return { error: "El código venció. Pide uno nuevo.", tipo: "vencido" };
  if (r === "agotado") return { error: "Superaste los intentos permitidos. Pide un código nuevo.", tipo: "vencido" };
  if (r === "inexistente") return { error: "Este código ya no es válido. Pide uno nuevo.", tipo: "vencido" };
  if (r === "incorrecto") return { error: `El código no coincide. Te quedan ${restantes} intentos.`, tipo: "incorrecto" };
  await db.usuario.update({ where: { id: u.id }, data: { correoVerificado: true } });
  await enviarCorreo(u.correo, { tipo: "bienvenida", nombre: u.nombres.split(" ")[0]!, comunidad: u.tipo === "comunidad" });
  await crearSesion({ sub: u.id, k: "u", rol: u.tipo, nombre: u.nombres });
  await auditar(u.correo, u.tipo, "verificar_correo", "usuarios", u.id);
  return { ok: true, redir: "/portal?ok=" + encodeURIComponent("Cuenta verificada. ¡Bienvenido!") };
}

export async function reenviarCodigo(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const tipo = (String(fd.get("tipoCodigo") || "registro")) as "registro" | "recuperacion";
  const p = await puedeReenviar(correo, tipo);
  if (!p.ok) return { error: `Espera ${p.espera} segundos para pedir otro código.`, espera: p.espera };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u) {
    const { codigo } = await generarCodigo(correo, tipo);
    await enviarCorreo(correo, { tipo: tipo === "registro" ? "codigo_verificacion" : "codigo_recuperacion", nombre: u.nombres.split(" ")[0]!, codigo });
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
  await db.usuario.update({ where: { id: u.id }, data: { correo: nuevo } });
  const { codigo } = await generarCodigo(nuevo, "registro");
  await enviarCorreo(nuevo, { tipo: "codigo_verificacion", nombre: u.nombres.split(" ")[0]!, codigo });
  redirect(`/verificar?correo=${encodeURIComponent(nuevo)}`);
}

export async function ingresar(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const siguiente = String(fd.get("siguiente") || "");
  const valores = { correo };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && u.bloqueadoHasta && u.bloqueadoHasta > new Date()) {
    const min = Math.ceil((u.bloqueadoHasta.getTime() - Date.now()) / 60000);
    return { tipo: "bloqueada", error: `Tu cuenta está bloqueada por seguridad durante ${min} minutos más, por varios intentos fallidos. También puedes cambiar tu contraseña.`, valores };
  }
  if (!u || u.estado === "eliminado" || !(await verificarPassword(password, u.passwordHash))) {
    if (u) {
      const n = u.intentosFallidos + 1;
      await db.usuario.update({ where: { id: u.id }, data: { intentosFallidos: n >= 5 ? 0 : n, bloqueadoHasta: n >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
      if (n >= 5) return { tipo: "bloqueada", error: "Bloqueamos tu cuenta durante 15 minutos por 5 intentos fallidos. Puedes esperar o cambiar tu contraseña.", valores };
    }
    return { tipo: "credenciales", error: "El correo o la contraseña no coinciden. Revisa e intenta de nuevo.", valores };
  }
  if (!u.correoVerificado) return { tipo: "sin_verificar", error: "Aún no has verificado tu correo. Te enviamos un código para activarla.", valores };
  await db.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
  await crearSesion({ sub: u.id, k: "u", rol: u.tipo, nombre: u.nombres }, fd.get("recordar") === "on");
  redirect(siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/portal");
}

export async function verificarAhora(fd: FormData) {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && !u.correoVerificado) {
    const { codigo } = await generarCodigo(correo, "registro");
    await enviarCorreo(correo, { tipo: "codigo_verificacion", nombre: u.nombres.split(" ")[0]!, codigo });
  }
  redirect(`/verificar?correo=${encodeURIComponent(correo)}`);
}

export async function recuperarPaso1(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  if (!z.string().email().safeParse(correo).success) return { campos: { correo: "Escribe un correo válido." }, valores: { correo } };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u) {
    const p = await puedeReenviar(correo, "recuperacion");
    if (p.ok) {
      const { codigo } = await generarCodigo(correo, "recuperacion");
      await enviarCorreo(correo, { tipo: "codigo_recuperacion", nombre: u.nombres.split(" ")[0]!, codigo });
    }
  }
  redirect(`/recuperar/codigo?correo=${encodeURIComponent(correo)}`);
}

export async function recuperarPaso2(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").toLowerCase();
  const codigo = String(fd.get("codigo") || "");
  if (!/^\d{6}$/.test(codigo)) return { error: "Escribe los 6 dígitos del código.", tipo: "incompleto" };
  const { r, restantes } = await verificarCodigo(correo, "recuperacion", codigo);
  if (r === "incorrecto") return { error: `El código no coincide. Te quedan ${restantes} intentos.`, tipo: "incorrecto" };
  if (r !== "ok") return { error: "El código venció o ya no es válido. Pide uno nuevo.", tipo: "vencido" };
  (await cookies()).set("udem_rec", await firmar({ sub: correo, k: "u", rol: "recuperacion", nombre: "" }, 1), { httpOnly: true, sameSite: "lax", path: "/recuperar", maxAge: 900, secure: process.env.NODE_ENV === "production" });
  redirect("/recuperar/nueva");
}

export async function recuperarPaso3(_: Estado, fd: FormData): Promise<Estado> {
  const t = await leer((await cookies()).get("udem_rec")?.value);
  if (!t || t.rol !== "recuperacion") return { error: "La solicitud venció. Empieza de nuevo." };
  const p = String(fd.get("password") || ""), c = String(fd.get("confirmar") || "");
  if (!passwordValida(p)) return { campos: { password: PASS } };
  if (p !== c) return { campos: { confirmar: "Las contraseñas no coinciden." } };
  const u = await db.usuario.update({ where: { correo: t.sub }, data: { passwordHash: await hashPassword(p), intentosFallidos: 0, bloqueadoHasta: null } });
  (await cookies()).delete({ name: "udem_rec", path: "/recuperar" });
  await auditar(u.correo, u.tipo, "cambiar_contrasena", "usuarios", u.id, "Recuperación");
  redirect("/recuperar/listo");
}

export async function ingresarPersonal(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const p = await db.personal.findUnique({ where: { correo } });
  if (!p || !p.activo || !(await verificarPassword(password, p.passwordHash))) {
    await auditar(correo, "desconocido", "ingreso_fallido", "personal");
    return { error: "El correo o la contraseña no coinciden.", valores: { correo } };
  }
  const { codigo } = await generarCodigo(correo, "doble_factor");
  await enviarCorreo(correo, { tipo: "codigo_doble_factor", nombre: p.nombre.split(" ")[0]!, codigo });
  (await cookies()).set("udem_2fa", await firmar({ sub: p.id, k: "p", rol: p.rol, nombre: p.nombre }, 1), { httpOnly: true, sameSite: "lax", path: "/personal", maxAge: 600, secure: process.env.NODE_ENV === "production" });
  redirect("/personal/verificar");
}

export async function verificarPersonal(_: Estado, fd: FormData): Promise<Estado> {
  const t = await leer((await cookies()).get("udem_2fa")?.value);
  if (!t) return { error: "La verificación venció. Ingresa de nuevo.", tipo: "vencido" };
  const p = await db.personal.findUnique({ where: { id: t.sub } });
  if (!p) return { error: "Cuenta no encontrada.", tipo: "vencido" };
  const codigo = String(fd.get("codigo") || "");
  const { r, restantes } = await verificarCodigo(p.correo, "doble_factor", codigo);
  if (r === "incorrecto") return { error: `El código no coincide. Te quedan ${restantes} intentos.`, tipo: "incorrecto" };
  if (r !== "ok") return { error: "El código venció. Ingresa de nuevo para recibir otro.", tipo: "vencido" };
  (await cookies()).delete({ name: "udem_2fa", path: "/personal" });
  await db.personal.update({ where: { id: p.id }, data: { ultimoIngreso: new Date() } });
  await crearSesion({ sub: p.id, k: "p", rol: p.rol, nombre: p.nombre });
  await auditar(p.correo, p.rol, "ingreso", "personal", p.id);
  redirect(p.rol === "tesoreria" ? "/tesoreria" : p.rol === "bienestar" ? "/bienestar" : "/admin");
}

export async function salir() {
  await cerrarSesion();
  redirect("/?ok=" + encodeURIComponent("Cerraste sesión."));
}
