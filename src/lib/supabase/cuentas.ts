import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseAdmin, supabaseAislado } from "./servidor";

/** Lo que la app guarda en auth.users.app_metadata (solo la clave service_role puede cambiarlo). */
export type MetaCuenta = { k: "u" | "p"; rol: string; ref: string; nombre: string };

export class CuentaOcupada extends Error {}

/** Busca una cuenta de Supabase Auth por correo (recorre las páginas de usuarios). */
export async function buscarCuentaPorCorreo(admin: SupabaseClient, correo: string): Promise<User | null> {
  correo = correo.toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === correo);
    if (u) return u;
    if (data.users.length < 1000) return null;
  }
}

/**
 * Crea o actualiza la cuenta de Supabase Auth de un usuario o miembro del personal y devuelve su id.
 * Si ya existe una cuenta con ese correo que pertenece a otro tipo de cuenta, lanza CuentaOcupada.
 */
export async function guardarCuentaAuth(o: {
  authId?: string | null;
  correo: string;
  meta: MetaCuenta;
  password?: string;
  confirmado?: boolean;
}): Promise<string> {
  const admin = supabaseAdmin();
  const cambios = {
    email: o.correo,
    app_metadata: o.meta,
    ...(o.password ? { password: o.password } : {}),
    ...(o.confirmado ? { email_confirm: true } : {}),
  };
  if (o.authId) {
    const { error } = await admin.auth.admin.updateUserById(o.authId, cambios);
    if (!error) return o.authId;
    if (error.status !== 404) throw error;
  }
  const { data, error } = await admin.auth.admin.createUser({ ...cambios, email_confirm: o.confirmado ?? false });
  if (!error) return data.user.id;
  if (error.code !== "email_exists") throw error;
  const existente = await buscarCuentaPorCorreo(admin, o.correo);
  if (!existente) throw error;
  const k = (existente.app_metadata as Partial<MetaCuenta>).k;
  if (k && k !== o.meta.k) throw new CuentaOcupada("El correo ya pertenece a otra cuenta.");
  const r = await admin.auth.admin.updateUserById(existente.id, cambios);
  if (r.error) throw r.error;
  return existente.id;
}

/** true si la contraseña es correcta. Usa un cliente aislado y cierra enseguida esa sesión de prueba. */
export async function comprobarPassword(correo: string, password: string) {
  if (!password) return false;
  const sb = supabaseAislado();
  const { data, error } = await sb.auth.signInWithPassword({ email: correo, password });
  if (error || !data.session) return false;
  await sb.auth.signOut({ scope: "local" });
  return true;
}

/** Bloquea o desbloquea el ingreso de una cuenta en Supabase Auth. */
export async function bloquearCuentaAuth(authId: string | null | undefined, bloquear: boolean) {
  if (!authId) return;
  const { error } = await supabaseAdmin().auth.admin.updateUserById(authId, { ban_duration: bloquear ? "876000h" : "none" });
  if (error && error.status !== 404) throw error;
}

export async function borrarCuentaAuth(authId: string | null | undefined) {
  if (!authId) return;
  const { error } = await supabaseAdmin().auth.admin.deleteUser(authId);
  if (error && error.status !== 404) throw error;
}
