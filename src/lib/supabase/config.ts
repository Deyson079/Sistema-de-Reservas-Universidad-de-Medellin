// Configuración de Supabase Auth compartida por el servidor y el middleware (edge): sin "server-only" ni next/headers.
import type { CookieOptions } from "@supabase/ssr";

export const supabaseUrl = () => process.env.SUPABASE_URL || "";
export const supabaseAnon = () => process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
export const supabaseConfigurado = () => Boolean(supabaseUrl() && supabaseAnon());

/** Si existe, la sesión de Supabase dura 30 días ("Recordarme"); si no, las cookies mueren al cerrar el navegador. */
export const COOKIE_RECORDAR = "udem_recordar";

/** Quita la caducidad de las cookies de sesión cuando el usuario no pidió "Recordarme" (no toca los borrados). */
export function ajustarCookie(options: CookieOptions, recordar: boolean): CookieOptions {
  if (recordar || !options.maxAge || options.maxAge <= 0) return options;
  const { maxAge: _m, expires: _e, ...resto } = options;
  return resto;
}
