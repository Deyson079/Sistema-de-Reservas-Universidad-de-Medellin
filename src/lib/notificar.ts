import "server-only";
import { db } from "./db";

export async function notificar(usuarioId: string, tipo: string, titulo: string, mensaje: string, enlace?: string) {
  await db.notificacion.create({ data: { usuarioId, tipo, titulo, mensaje, enlace } });
}
