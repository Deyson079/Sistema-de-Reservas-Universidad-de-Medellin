// Lectura de la sesión de Supabase Auth. Sin dependencias: la usa el middleware (edge) y el servidor.

export type Sesion = {
  sub: string; // id en la base de datos (usuarios.id o personal.id); en los tokens propios, lo que corresponda
  k: "u" | "p"; // usuario o personal
  rol: string; // comunidad | externo | tesoreria | bienestar | administrador
  nombre: string;
  authId?: string; // id en Supabase Auth
  sid?: string; // id de la sesión de Supabase Auth
};

type Claims = { sub?: string; session_id?: string; app_metadata?: object };
type MetaApp = { k?: "u" | "p"; rol?: string; ref?: string; nombre?: string };

/** Convierte los claims verificados de Supabase Auth en la sesión de la app. */
export function sesionDesdeClaims(claims: Claims | null | undefined): Sesion | null {
  const m = claims?.app_metadata as MetaApp | undefined;
  if (!claims?.sub || !m?.k || !m.ref) return null;
  return { sub: m.ref, k: m.k, rol: m.rol ?? "", nombre: m.nombre ?? "", authId: claims.sub, sid: claims.session_id };
}
