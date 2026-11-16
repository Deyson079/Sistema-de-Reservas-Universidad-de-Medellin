import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { COOKIE, firmar, leer, type Sesion } from "./sesion-token";

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verificarPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function crearSesion(s: Sesion, recordar = false) {
  const dias = s.k === "p" ? 1 : recordar ? 30 : 1;
  const token = await firmar(s, dias);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: recordar || s.k === "p" ? dias * 86400 : undefined,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function getSesion() {
  return leer((await cookies()).get(COOKIE)?.value);
}

/** Usuario (comunidad o externo) con sesión; si no hay, va a Ingresar */
export async function requireUsuario() {
  const s = await getSesion();
  if (!s || s.k !== "u") redirect("/ingresar");
  const u = await db.usuario.findUnique({ where: { id: s.sub }, include: { facturacion: true } });
  if (!u || u.estado === "eliminado") redirect("/ingresar");
  return u;
}

export async function requirePersonal(roles: Array<"tesoreria" | "bienestar" | "administrador">) {
  const s = await getSesion();
  if (!s || s.k !== "p") redirect("/personal");
  const p = await db.personal.findUnique({ where: { id: s.sub } });
  if (!p || !p.activo) redirect("/personal");
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
