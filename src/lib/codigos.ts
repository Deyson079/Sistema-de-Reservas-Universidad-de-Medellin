import "server-only";
import type { EmailOtpType, Session, User } from "@supabase/supabase-js";
import { db } from "./db";
import type { TipoCodigo } from "@prisma/client";
import { supabaseAdmin, supabaseAislado, supabaseServidor } from "./supabase/servidor";

// Supabase Auth genera, envía y comprueba los códigos de 6 dígitos.
// La tabla codigos_verificacion solo registra cada envío para la cuenta atrás, la espera de reenvío y el tope de intentos.
const MINUTOS = 10; // igual que "Email OTP Expiration" (600 s) en Supabase
const MAX_INTENTOS = 5;
const ESPERA_REENVIO_S = 60;

/** Modo de pruebas (EMAIL_MODO distinto de "smtp"): el código no se envía, se muestra en pantalla y en la terminal. */
export const modoConsola = () => process.env.EMAIL_MODO !== "smtp";

const g = globalThis as unknown as { codigosDemo?: Map<string, string> };
export const codigosDemo = (g.codigosDemo ??= new Map());

export type ResultadoEnvio = { ok: true } | { ok: false; error: string; espera?: number };

function errorEnvio(e: { status?: number; code?: string; message: string }): ResultadoEnvio {
  if (e.status === 429 || e.code === "over_email_send_rate_limit" || e.code === "over_request_rate_limit") {
    const s = Number(/(\d+)\s*seconds?/i.exec(e.message)?.[1] ?? ESPERA_REENVIO_S);
    return { ok: false, error: `Espera ${s} segundos para pedir otro código.`, espera: s };
  }
  if (e.code === "email_exists") return { ok: false, error: "Ya hay una cuenta con ese correo." };
  console.error("[supabase auth]", e.code, e.message);
  return { ok: false, error: "No pudimos enviar el código. Intenta de nuevo en unos minutos." };
}

/**
 * Pide a Supabase un código para `correo`.
 * - registro: confirma el correo de una cuenta nueva (plantilla "Confirm signup").
 * - recuperacion: cambio de contraseña (plantilla "Reset Password").
 * - doble_factor: segundo paso del personal (plantilla "Magic Link").
 * - cambio_correo: confirma el correo nuevo `nuevo` del usuario con sesión (plantilla "Change Email Address").
 */
export async function enviarCodigo(correo: string, tipo: TipoCodigo, nuevo?: string): Promise<ResultadoEnvio> {
  correo = correo.toLowerCase();
  const destino = (tipo === "cambio_correo" ? nuevo! : correo).toLowerCase();

  if (modoConsola()) {
    const admin = supabaseAdmin().auth.admin;
    const { data, error } =
      tipo === "recuperacion" ? await admin.generateLink({ type: "recovery", email: correo })
      : tipo === "cambio_correo" ? await admin.generateLink({ type: "email_change_new", email: correo, newEmail: destino })
      : await admin.generateLink({ type: "magiclink", email: correo });
    if (error) return errorEnvio(error);
    codigosDemo.set(`${tipo}:${destino}`, data.properties.email_otp);
    console.log(`[modo de pruebas] Código ${tipo} para ${destino}: ${data.properties.email_otp}`);
  } else {
    const sb = supabaseAislado();
    const { error } =
      tipo === "registro" ? await sb.auth.resend({ type: "signup", email: correo })
      : tipo === "recuperacion" ? await sb.auth.resetPasswordForEmail(correo)
      : tipo === "doble_factor" ? await sb.auth.signInWithOtp({ email: correo, options: { shouldCreateUser: false } })
      : await (await supabaseServidor()).auth.updateUser({ email: destino });
    if (error) return errorEnvio(error);
  }

  await db.codigoVerificacion.updateMany({ where: { correo: destino, tipo, usado: false }, data: { usado: true } });
  await db.codigoVerificacion.create({ data: { correo: destino, tipo, codigo: "supabase", expiraEn: new Date(Date.now() + MINUTOS * 60_000) } });
  return { ok: true };
}

export async function puedeReenviar(correo: string, tipo: TipoCodigo) {
  const ult = await db.codigoVerificacion.findFirst({ where: { correo: correo.toLowerCase(), tipo }, orderBy: { creadoEn: "desc" } });
  if (!ult) return { ok: true, espera: 0 };
  const pasados = (Date.now() - ult.creadoEn.getTime()) / 1000;
  return { ok: pasados >= ESPERA_REENVIO_S, espera: Math.max(0, Math.ceil(ESPERA_REENVIO_S - pasados)) };
}

export async function codigoVigente(correo: string, tipo: TipoCodigo) {
  return db.codigoVerificacion.findFirst({ where: { correo: correo.toLowerCase(), tipo, usado: false }, orderBy: { creadoEn: "desc" } });
}

export type ResultadoCodigo = "ok" | "incorrecto" | "vencido" | "agotado" | "inexistente";

const TIPO_OTP: Record<TipoCodigo, EmailOtpType> = { registro: "email", doble_factor: "email", recuperacion: "recovery", cambio_correo: "email_change" };

/**
 * Comprueba el código con Supabase. Si es correcto, Supabase abre la sesión en las cookies del navegador
 * (o actualiza el correo, en cambio_correo). `correo` es el correo al que se envió el código.
 */
export async function verificarCodigo(
  correo: string,
  tipo: TipoCodigo,
  codigo: string,
): Promise<{ r: ResultadoCodigo; restantes?: number; session?: Session | null; user?: User | null }> {
  correo = correo.toLowerCase();
  const c = await codigoVigente(correo, tipo);
  if (!c) return { r: "inexistente" };
  if (c.expiraEn < new Date()) return { r: "vencido" };
  if (c.intentos >= MAX_INTENTOS) return { r: "agotado" };
  const sb = await supabaseServidor();
  const { data, error } = await sb.auth.verifyOtp({ email: correo, token: codigo, type: TIPO_OTP[tipo] });
  if (error) {
    await db.codigoVerificacion.update({ where: { id: c.id }, data: { intentos: { increment: 1 } } });
    const restantes = MAX_INTENTOS - c.intentos - 1;
    return { r: restantes <= 0 ? "agotado" : "incorrecto", restantes };
  }
  await db.codigoVerificacion.update({ where: { id: c.id }, data: { usado: true } });
  codigosDemo.delete(`${tipo}:${correo}`);
  return { r: "ok", session: data.session, user: data.user };
}
