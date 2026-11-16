import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const TIPOS = ["application/pdf", "image/jpeg", "image/png"];
const MAX = 5 * 1024 * 1024;

export function validarArchivo(f: File | null, soloPdf = false) {
  if (!f || f.size === 0) return "Elige un archivo.";
  if (f.size > MAX) return "El archivo pesa más de 5 MB.";
  if (soloPdf ? f.type !== "application/pdf" : !TIPOS.includes(f.type)) return soloPdf ? "El archivo debe ser PDF." : "El archivo debe ser PDF, JPG o PNG.";
  return null;
}

/** Guarda en Supabase Storage si está configurado; si no, en public/uploads (solo desarrollo). */
export async function guardarArchivo(f: File, carpeta: string) {
  const ext = f.name.split(".").pop()?.toLowerCase() || "bin";
  const nombre = `${carpeta}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await f.arrayBuffer());
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const bucket = process.env.SUPABASE_BUCKET || "documentos";
    const { error } = await sb.storage.from(bucket).upload(nombre, buf, { contentType: f.type });
    if (error) throw new Error("No se pudo subir el archivo: " + error.message);
    return `supabase://${bucket}/${nombre}`;
  }
  const dir = path.join(process.cwd(), "public", "uploads", carpeta);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", nombre), buf);
  return `/uploads/${nombre}`;
}

/** URL para ver un archivo guardado (firma temporal en Supabase) */
export async function urlArchivo(ref: string | null | undefined) {
  if (!ref) return null;
  if (!ref.startsWith("supabase://")) return ref;
  const [, resto] = ref.split("supabase://");
  const [bucket, ...p] = resto.split("/");
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.storage.from(bucket).createSignedUrl(p.join("/"), 600);
  return data?.signedUrl ?? null;
}
