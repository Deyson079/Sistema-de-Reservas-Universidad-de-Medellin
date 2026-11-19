"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "./db";
import { getConfig, esCorreoInstitucional } from "./config";
import { cerrarSesion, fijarRecordar, passwordValida } from "./auth";
import { enviarCorreo } from "./email";
import { guardarArchivo, validarArchivo } from "./storage";
import { auditar } from "./auditoria";
import { CuentaOcupada, guardarCuentaAuth } from "./supabase/cuentas";
import { supabaseAdmin, supabaseServidor } from "./supabase/servidor";

export type Estado = { error?: string; campos?: Record<string, string>; valores?: Record<string, string>; ok?: boolean; tipo?: string; espera?: number; redir?: string } | undefined;

const val = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
const errores = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
const PASS = "La contraseña necesita 8 caracteres, una mayúscula y un número.";
const OCUPADO = "Ya hay una cuenta con este correo. Ingresa con tu contraseña.";

const base = {
  correo: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  celular: z.string().trim().regex(/^3\d{9}$/, "Escribe los 10 dígitos de tu celular, sin espacios."),
  password: z.string().refine(passwordValida, PASS),
  confirmar: z.string(),
  terminos: z.literal("on", { message: "Debes aceptar los términos y la política de datos." }),
};

type DatosUsuario = Parameters<typeof db.usuario.create>[0]["data"] & { correo: string; nombres: string; tipo: "comunidad" | "externo" };

/**
 * Guarda la fila del usuario, crea o actualiza su cuenta en Supabase Auth ya confirmada (sin código por correo),
 * abre la sesión y lo lleva a su portal.
 */
async function crearCuentaUsuario(existe: { id: string } | null, datos: DatosUsuario, password: string, valores: Record<string, string>): Promise<Estado> {
  const fila = existe
    ? await db.usuario.update({ where: { id: existe.id }, data: { ...(datos as Parameters<typeof db.usuario.update>[0]["data"]), correoVerificado: true } })
    : await db.usuario.create({ data: { ...datos, correoVerificado: true } });
  try {
    const authId = await guardarCuentaAuth({ authId: fila.authId, correo: datos.correo, password, confirmado: true, meta: { k: "u", rol: datos.tipo, ref: fila.id, nombre: datos.nombres } });
    if (authId !== fila.authId) await db.usuario.update({ where: { id: fila.id }, data: { authId } });
  } catch (e) {
    if (!existe) await db.usuario.delete({ where: { id: fila.id } });
    if (e instanceof CuentaOcupada) return { campos: { correo: OCUPADO }, valores };
    console.error("[registro]", e);
    return { error: "No pudimos crear la cuenta en este momento. Intenta de nuevo en unos minutos.", valores };
  }
  await fijarRecordar(false);
  const { error } = await (await supabaseServidor({ recordar: false })).auth.signInWithPassword({ email: datos.correo, password });
  await Promise.all([
    enviarCorreo(datos.correo, { tipo: "bienvenida", nombre: datos.nombres.split(" ")[0]!, comunidad: datos.tipo === "comunidad" }).catch((e) => console.error("[bienvenida]", e)),
    auditar(datos.correo, datos.tipo, "registro", "usuarios", fila.id),
  ]);
  // Si por algo no se pudo abrir la sesión, la cuenta ya existe: que ingrese con su contraseña
  if (error) redirect("/ingresar?ok=" + encodeURIComponent("Cuenta creada. Ingresa con tu correo y contraseña."));
  redirect("/portal?ok=" + encodeURIComponent("Cuenta creada. ¡Bienvenido!"));
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

export async function ingresar(_: Estado, fd: FormData): Promise<Estado> {
  const correo = String(fd.get("correo") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const siguiente = String(fd.get("siguiente") || "");
  const recordar = fd.get("recordar") === "on";
  const valores = { correo };
  const u = await db.usuario.findUnique({ where: { correo } });
  if (u && u.bloqueadoHasta && u.bloqueadoHasta > new Date()) {
    const min = Math.ceil((u.bloqueadoHasta.getTime() - Date.now()) / 60000);
    return { tipo: "bloqueada", error: `Tu cuenta está bloqueada por seguridad durante ${min} minutos más, por varios intentos fallidos.`, valores };
  }
  const fallo = async (): Promise<Estado> => {
    if (u) {
      const n = u.intentosFallidos + 1;
      await db.usuario.update({ where: { id: u.id }, data: { intentosFallidos: n >= 5 ? 0 : n, bloqueadoHasta: n >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
      if (n >= 5) return { tipo: "bloqueada", error: "Bloqueamos tu cuenta durante 15 minutos por 5 intentos fallidos. Espera e intenta de nuevo.", valores };
    }
    return { tipo: "credenciales", error: "El correo o la contraseña no coinciden. Revisa e intenta de nuevo.", valores };
  };
  // Solo cuentas de usuarios: el personal entra por /personal
  if (!u || u.estado === "eliminado" || !u.authId) return fallo();
  await fijarRecordar(recordar);
  const sb = await supabaseServidor({ recordar });
  let { data, error } = await sb.auth.signInWithPassword({ email: correo, password });
  if (error?.code === "email_not_confirmed") {
    // Cuentas creadas cuando se exigía el código: se confirman aquí y se reintenta (la contraseña se sigue comprobando)
    await supabaseAdmin().auth.admin.updateUserById(u.authId, { email_confirm: true });
    ({ data, error } = await sb.auth.signInWithPassword({ email: correo, password }));
  }
  if (error || !data.user) return fallo();
  if ((data.user.app_metadata as { k?: string }).k !== "u" || data.user.id !== u.authId) {
    await sb.auth.signOut({ scope: "local" });
    return fallo();
  }
  await db.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null, correoVerificado: true } });
  redirect(siguiente.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/portal");
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
