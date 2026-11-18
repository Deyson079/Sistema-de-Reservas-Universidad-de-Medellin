// Tokens firmados propios (compatibles con el middleware en edge) y lectura de la sesión de Supabase Auth.
import { SignJWT, jwtVerify } from "jose";

/** Marca que el personal superó la verificación en dos pasos en ESTA sesión de Supabase. */
export const COOKIE_PERSONAL = "udem_personal";

export type Sesion = {
  sub: string; // id en la base de datos (usuarios.id o personal.id); en los tokens propios, lo que corresponda
  k: "u" | "p"; // usuario o personal
  rol: string; // comunidad | externo | tesoreria | bienestar | administrador
  nombre: string;
  authId?: string; // id en Supabase Auth
  sid?: string; // id de la sesión de Supabase Auth
};

const clave = () => new TextEncoder().encode(process.env.AUTH_SECRET || "desarrollo-inseguro-cambia-AUTH_SECRET");

export async function firmar(s: Sesion, dias: number) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${dias}d`)
    .sign(clave());
}

export async function leer(token?: string): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave());
    return payload as unknown as Sesion;
  } catch {
    return null;
  }
}

type Claims = { sub?: string; session_id?: string; app_metadata?: object };
type MetaApp = { k?: "u" | "p"; rol?: string; ref?: string; nombre?: string };

/**
 * Convierte los claims verificados de Supabase Auth en la sesión de la app.
 * El personal solo cuenta como autenticado si además tiene la marca de doble factor de esa misma sesión.
 */
export async function sesionDesdeClaims(claims: Claims | null | undefined, marcaPersonal?: string): Promise<Sesion | null> {
  const m = claims?.app_metadata as MetaApp | undefined;
  if (!claims?.sub || !m?.k || !m.ref) return null;
  if (m.k === "p") {
    const t = await leer(marcaPersonal);
    if (!t || t.sub !== claims.sub || !t.sid || t.sid !== claims.session_id) return null;
  }
  return { sub: m.ref, k: m.k, rol: m.rol ?? "", nombre: m.nombre ?? "", authId: claims.sub, sid: claims.session_id };
}
