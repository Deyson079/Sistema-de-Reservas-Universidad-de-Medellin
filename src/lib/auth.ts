import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { db } from "./db";
import { COOKIE_PERSONAL, firmar, sesionDesdeClaims } from "./sesion-token";
import { COOKIE_RECORDAR, supabaseConfigurado } from "./supabase/config";
import { supabaseServidor } from "./supabase/servidor";

const seguro = () => process.env.NODE_ENV === "production";

/** Guarda si la sesión debe durar 30 días ("Recordarme") o morir al cerrar el navegador. Llamar antes de iniciar sesión. */
export async function fijarRecordar(recordar: boolean) {
  const c = await cookies();
  if (recordar) c.set(COOKIE_RECORDAR, "1", { httpOnly: true, sameSite: "lax", secure: seguro(), path: "/", maxAge: 30 * 86400 });
  else c.delete(COOKIE_RECORDAR);
}

/** Tras el doble factor del personal: liga la marca a la sesión de Supabase recién creada (dura 1 día). */
export async function marcarPersonal(accessToken: string, p: { rol: string; nombre: string }) {
  const claims = decodeJwt(accessToken) as { sub?: string; session_id?: string };
  if (!claims.sub || !claims.session_id) throw new Error("Sesión de Supabase sin identificador.");
  const token = await firmar({ sub: claims.sub, k: "p", rol: p.rol, nombre: p.nombre, sid: claims.session_id }, 1);
  (await cookies()).set(COOKIE_PERSONAL, token, { httpOnly: true, sameSite: "lax", secure: seguro(), path: "/" });
}

export async function cerrarSesion(alcance: "local" | "global" = "local") {
  const c = await cookies();
  if (supabaseConfigurado()) await (await supabaseServidor()).auth.signOut({ scope: alcance });
  c.delete(COOKIE_PERSONAL);
  c.delete(COOKIE_RECORDAR);
}

export async function getSesion() {
  if (!supabaseConfigurado()) return null;
  const { data } = await (await supabaseServidor()).auth.getClaims();
  return sesionDesdeClaims(data?.claims, (await cookies()).get(COOKIE_PERSONAL)?.value);
}

/** Usuario (comunidad o externo) con sesión; si no hay, va a Ingresar */
export async function requireUsuario() {
  const s = await getSesion();
  if (!s || s.k !== "u") redirect("/ingresar");
  const u = await db.usuario.findUnique({ where: { id: s.sub }, include: { facturacion: true } });
  if (!u || u.estado === "eliminado" || u.authId !== s.authId) redirect("/ingresar");
  return u;
}

export async function requirePersonal(roles: Array<"tesoreria" | "bienestar" | "administrador">) {
  const s = await getSesion();
  if (!s || s.k !== "p") redirect("/personal");
  const p = await db.personal.findUnique({ where: { id: s.sub } });
  if (!p || !p.activo || p.authId !== s.authId) redirect("/personal");
  if (!roles.includes(p.rol) && p.rol !== "administrador") redirect("/personal?error=permiso");
  return p;
}

export function validarPassword(p: string) {
  return { len: p.length >= 8, may: /[A-ZÁÉÍÓÚÑ]/.test(p), num: /\d/.test(p), sim: /[^\wáéíóúñÁÉÍÓÚÑ\s]/.test(p) };
}
export function passwordValida(p: string) {
  const r = validarPassword(p);
  return r.len && r.may && r.num;
}
