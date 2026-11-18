// Crea en Supabase Auth las cuentas de usuarios y personal que aún no tienen auth_id,
// con el mismo hash bcrypt: cada persona sigue entrando con su contraseña de siempre.
// Si ya existe una cuenta con ese correo (p. ej. tras volver a sembrar), la reutiliza y la actualiza.
import type { PrismaClient } from "@prisma/client";
import { createClient, type User } from "@supabase/supabase-js";

type Meta = { k: "u" | "p"; rol: string; ref: string; nombre: string };

export async function sincronizarAuth(db: PrismaClient) {
  const url = process.env.SUPABASE_URL, clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) {
    console.warn("⚠ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY: no se sincronizaron las cuentas con Supabase Auth.");
    return;
  }
  const admin = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;

  // Cuentas que ya existen en Supabase Auth, por correo
  const porCorreo = new Map<string, User>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) porCorreo.set(u.email.toLowerCase(), u);
    if (data.users.length < 1000) break;
  }

  let creadas = 0, enlazadas = 0, omitidas = 0;
  async function sincronizar(correo: string, hash: string | null, confirmado: boolean, meta: Meta): Promise<string | null> {
    const existente = porCorreo.get(correo.toLowerCase());
    const attrs = { app_metadata: meta, ...(confirmado ? { email_confirm: true } : {}), ...(hash ? { password_hash: hash } : {}) };
    if (existente) {
      const k = (existente.app_metadata as Partial<Meta>).k;
      if (k && k !== meta.k) { console.warn(`  · ${correo}: ya es una cuenta de otro tipo en Supabase Auth, se omite.`); omitidas++; return null; }
      const { error } = await admin.updateUserById(existente.id, attrs);
      if (error) throw new Error(`${correo}: ${error.message}`);
      enlazadas++;
      return existente.id;
    }
    if (!hash) { console.warn(`  · ${correo}: no tiene contraseña guardada, se omite.`); omitidas++; return null; }
    const { data, error } = await admin.createUser({ email: correo, email_confirm: confirmado, ...attrs });
    if (error) throw new Error(`${correo}: ${error.message}`);
    creadas++;
    return data.user.id;
  }

  for (const p of await db.personal.findMany({ where: { authId: null } })) {
    const authId = await sincronizar(p.correo, p.passwordHash, true, { k: "p", rol: p.rol, ref: p.id, nombre: p.nombre });
    if (authId) await db.personal.update({ where: { id: p.id }, data: { authId } });
    if (authId && !p.activo) await admin.updateUserById(authId, { ban_duration: "876000h" });
  }
  for (const u of await db.usuario.findMany({ where: { authId: null, estado: { not: "eliminado" } } })) {
    const authId = await sincronizar(u.correo, u.passwordHash, u.correoVerificado, { k: "u", rol: u.tipo, ref: u.id, nombre: u.nombres });
    if (authId) await db.usuario.update({ where: { id: u.id }, data: { authId } });
    if (authId && u.estado === "bloqueado") await admin.updateUserById(authId, { ban_duration: "876000h" });
  }
  console.log(`Supabase Auth: ${creadas} cuentas creadas, ${enlazadas} enlazadas, ${omitidas} omitidas.`);
}
