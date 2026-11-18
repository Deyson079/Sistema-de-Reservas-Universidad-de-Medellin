import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ajustarCookie, COOKIE_RECORDAR, supabaseAnon, supabaseUrl } from "./config";

function exigir(valor: string, nombre: string) {
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} para Supabase Auth.`);
  return valor;
}

/** Cliente con la sesión del visitante en cookies (Server Components, Server Actions y Route Handlers). */
export async function supabaseServidor(opciones: { recordar?: boolean } = {}) {
  const c = await cookies();
  const recordar = opciones.recordar ?? c.get(COOKIE_RECORDAR)?.value === "1";
  return createServerClient(exigir(supabaseUrl(), "SUPABASE_URL"), exigir(supabaseAnon(), "SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => c.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) c.set(name, value, ajustarCookie(options, recordar));
        } catch {
          // En un Server Component no se pueden escribir cookies; el middleware ya renueva la sesión.
        }
      },
    },
  });
}

/** Cliente sin cookies: comprueba contraseñas o envía códigos sin tocar la sesión del navegador. */
export function supabaseAislado() {
  return createClient(exigir(supabaseUrl(), "SUPABASE_URL"), exigir(supabaseAnon(), "SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Cliente con la clave service_role: crea, actualiza y borra cuentas. Nunca llega al navegador. */
export function supabaseAdmin() {
  return createClient(exigir(supabaseUrl(), "SUPABASE_URL"), exigir(process.env.SUPABASE_SERVICE_ROLE_KEY || "", "SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
