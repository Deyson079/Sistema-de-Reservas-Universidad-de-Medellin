import { db } from "./db";

export async function auditar(actor: string, actorRol: string, accion: string, entidad: string, entidadId?: string, detalle?: string) {
  try {
    await db.auditoria.create({ data: { actor, actorRol, accion, entidad, entidadId, detalle } });
  } catch (e) {
    console.error("No se pudo registrar auditoría", e);
  }
}
