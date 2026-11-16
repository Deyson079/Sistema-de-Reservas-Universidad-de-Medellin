import "server-only";
import { notFound } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";

export async function cargarFactura(facturaId: string) {
  const u = await requireUsuario();
  const f = await db.factura.findUnique({ where: { id: facturaId }, include: { reserva: { include: { cancha: true } }, pagos: { orderBy: { fecha: "desc" } } } });
  if (!f || f.reserva.usuarioId !== u.id) notFound();
  return { u, f };
}
