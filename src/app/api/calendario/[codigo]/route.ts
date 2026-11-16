import { db } from "@/lib/db";
import { getSesion } from "@/lib/auth";
import { fechaAIso, inicioFranja } from "@/lib/formato";

const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Archivo .ics para "Agregar al calendario" */
export async function GET(_: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const s = await getSesion();
  const r = await db.reserva.findUnique({ where: { codigo }, include: { cancha: true } });
  if (!r || !s || (s.k === "u" && r.usuarioId !== s.sub)) return new Response("No encontrada", { status: 404 });
  const iso = fechaAIso(r.fecha);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Universidad de Medellin//Reservas Deportivas//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${r.codigo}@reservas.udemedellin.edu.co`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(inicioFranja(iso, r.horaInicio))}`, `DTEND:${f(inicioFranja(iso, r.horaFin))}`,
    `SUMMARY:${r.actividad} · ${r.cancha.nombre}`, `LOCATION:${r.cancha.nombre}, Universidad de Medellín`, `DESCRIPTION:Reserva ${r.codigo}. Presenta el código QR y tu documento.`,
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Tu reserva empieza en 1 hora", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="reserva-${r.codigo}.ics"` } });
}
