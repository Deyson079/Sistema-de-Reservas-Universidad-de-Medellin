import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sesionDesdeClaims } from "./sesion";
import { COOKIE_RECORDAR, supabaseConfigurado } from "./supabase/config";
import { supabaseServidor } from "./supabase/servidor";

const seguro = () => process.env.NODE_ENV === "production";

/** Guarda si la sesión debe durar 30 días ("Recordarme") o morir al cerrar el navegador. Llamar antes de iniciar sesión. */
export async function fijarRecordar(recordar: boolean) {
  const c = await cookies();
  if (recordar) c.set(COOKIE_RECORDAR, "1", { httpOnly: true, sameSite: "lax", secure: seguro(), path: "/", maxAge: 30 * 86400 });
  else c.delete(COOKIE_RECORDAR);
}

export async function cerrarSesion(alcance: "local" | "global" = "local") {
  const c = await cookies();
  if (supabaseConfigurado()) await (await supabaseServidor()).auth.signOut({ scope: alcance });
  c.delete(COOKIE_RECORDAR);
}

/** Sesión del visitante. `cache` evita repetir la lectura cuando layout y página la piden en la misma petición. */
export const getSesion = cache(async () => {
  if (!supabaseConfigurado()) return null;
  const { data } = await (await supabaseServidor()).auth.getClaims();
  return sesionDesdeClaims(data?.claims);
});

const usuarioPorId = cache((id: string) => db.usuario.findUnique({ where: { id }, include: { facturacion: true } }));
const personalPorId = cache((id: string) => db.personal.findUnique({ where: { id } }));

/** Usuario (comunidad o externo) con sesión; si no hay, va a Ingresar */
export async function requireUsuario() {
  const s = await getSesion();
  if (!s || s.k !== "u") redirect("/ingresar");
  const u = await usuarioPorId(s.sub);
  if (!u || u.estado === "eliminado" || u.authId !== s.authId) redirect("/ingresar");
  return u;
}

export async function requirePersonal(roles: Array<"tesoreria" | "bienestar" | "administrador">) {
  const s = await getSesion();
  if (!s || s.k !== "p") redirect("/personal");
  const p = await personalPorId(s.sub);
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
