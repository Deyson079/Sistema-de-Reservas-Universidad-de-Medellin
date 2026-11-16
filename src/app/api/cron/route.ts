import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vencerReservas } from "@/lib/disponibilidad";
import { enviarCorreo } from "@/lib/email";
import { notificar } from "@/lib/notificar";
import { datosReserva } from "@/lib/reservas";
import { ahora, sumarDias, isoAFecha } from "@/lib/formato";

/** Tarea programada (Vercel Cron, una vez al día, 7:00 a. m.): vence reservas sin pago y recuerda las reservas de mañana */
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("No autorizado", { status: 401 });
  const vencidas = await vencerReservas();
  for (const r of vencidas) await enviarCorreo(r.usuario.correo, { tipo: "reserva_vencida", nombre: r.usuario.nombres, reserva: datosReserva(r) });
  const n = ahora();
  const manana = sumarDias(n.iso, 1);
  const recordar = await db.reserva.findMany({ where: { estado: "confirmada", fecha: isoAFecha(manana) }, include: { usuario: true, cancha: true } });
  for (const r of recordar) {
    const pref = (r.usuario.preferencias ?? {}) as { recordatorio?: boolean };
    await notificar(r.usuarioId, "recordatorio", "Mañana juegas", `${r.cancha.nombre}, ${datosReserva(r).franja}. Lleva tu documento y el QR.`, `/portal/reservas/${r.codigo}`);
    if (pref.recordatorio !== false) await enviarCorreo(r.usuario.correo, { tipo: "recordatorio", nombre: r.usuario.nombres, reserva: datosReserva(r) });
  }
  return NextResponse.json({ vencidas: vencidas.length, recordatorios: recordar.length });
}
