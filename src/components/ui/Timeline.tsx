import { CalendarPlus, Send, ShieldCheck, CircleCheck, X, TimerOff, Ban, UserCheck, UserX } from "lucide-react";
import { fechaHora } from "@/lib/formato";

type Paso = { titulo: string; detalle?: string; estado: "hecho" | "actual" | "pendiente" | "malo"; icono: "creada" | "pago" | "validacion" | "confirmada" | "rechazada" | "vencida" | "cancelada" | "asistio" | "no_asistio"; extra?: React.ReactNode };
const IC = { creada: CalendarPlus, pago: Send, validacion: ShieldCheck, confirmada: CircleCheck, rechazada: X, vencida: TimerOff, cancelada: Ban, asistio: UserCheck, no_asistio: UserX };

export function Timeline({ pasos }: { pasos: Paso[] }) {
  return (
    <ol className="timeline">
      {pasos.map((p, i) => {
        const I = IC[p.icono];
        return (
          <li key={i} className={p.estado}>
            <span className="pt"><I className="i i-sm" aria-hidden /></span>
            <div><b style={p.estado === "pendiente" ? { color: "var(--texto-2)" } : undefined}>{p.titulo}</b>{p.detalle && <small>{p.detalle}</small>}{p.extra}</div>
          </li>
        );
      })}
    </ol>
  );
}

type R = { estado: string; creadaEn: Date; motivoCancelacion: string | null; canceladaPor: string | null; actualizadaEn: Date; usuario?: { tipo: string } };
type Pg = { metodo: string; referencia: string | null; fecha: Date; estado: string; validadoEn: Date | null; motivoRechazo: string | null; validadoPor?: { nombre: string } | null };

/** Construye la línea de tiempo: creada → pago enviado → en validación → confirmada / rechazada / vencida / cancelada */
export function pasosReserva(r: R, comunidad: boolean, pagos: Pg[], extraRechazo?: React.ReactNode): Paso[] {
  const out: Paso[] = [{ titulo: "Creada", detalle: fechaHora(r.creadaEn), estado: "hecho", icono: "creada" }];
  const ult = pagos[0];
  if (comunidad) {
    if (r.estado === "cancelada") out.push({ titulo: "Cancelada", detalle: `${r.canceladaPor ?? ""}${r.motivoCancelacion ? ` · ${r.motivoCancelacion}` : ""}`, estado: "malo", icono: "cancelada" });
    else {
      out.push({ titulo: "Confirmada", detalle: "Sin costo, al instante", estado: "hecho", icono: "confirmada" });
      if (r.estado === "asistio") out.push({ titulo: "Asistió", detalle: fechaHora(r.actualizadaEn), estado: "hecho", icono: "asistio" });
      if (r.estado === "no_asistio") out.push({ titulo: "No asistió", estado: "malo", icono: "no_asistio" });
    }
    return out;
  }
  if (ult) out.push({ titulo: "Pago enviado", detalle: `${ult.metodo}${ult.referencia ? `, ref. ${ult.referencia}` : ""} · ${fechaHora(ult.fecha)}`, estado: "hecho", icono: "pago" });
  else if (r.estado === "pendiente_pago") out.push({ titulo: "Pago enviado", detalle: "Esperando tu pago", estado: "actual", icono: "pago" });
  if (r.estado === "en_validacion") out.push({ titulo: "En validación por Tesorería", detalle: "Te avisamos por correo cuando esté lista. Suele tardar menos de 1 día hábil.", estado: "actual", icono: "validacion" });
  else if (ult && ["confirmada", "asistio", "no_asistio", "rechazada"].includes(r.estado)) out.push({ titulo: "En validación por Tesorería", detalle: ult.validadoEn ? `Revisado ${fechaHora(ult.validadoEn)}` : undefined, estado: "hecho", icono: "validacion" });
  if (r.estado === "rechazada") out.push({ titulo: "Rechazada", detalle: `Por ${ult?.validadoPor?.nombre ?? "Tesorería"}${ult?.validadoEn ? ` · ${fechaHora(ult.validadoEn)}` : ""}`, estado: "malo", icono: "rechazada", extra: <>{ult?.motivoRechazo && <div className="motivo"><b style={{ fontSize: 13 }}>Motivo:</b> {ult.motivoRechazo}</div>}{extraRechazo}</> });
  else if (r.estado === "vencida") out.push({ titulo: "Vencida", detalle: "No recibimos el pago a tiempo y la franja se liberó.", estado: "malo", icono: "vencida" });
  else if (r.estado === "cancelada") out.push({ titulo: "Cancelada", detalle: `${r.canceladaPor ?? ""}${r.motivoCancelacion ? ` · ${r.motivoCancelacion}` : ""}`, estado: "malo", icono: "cancelada" });
  else if (["confirmada", "asistio", "no_asistio"].includes(r.estado)) {
    out.push({ titulo: "Confirmada", detalle: "Tu código QR ya está activo", estado: "hecho", icono: "confirmada" });
    if (r.estado === "asistio") out.push({ titulo: "Asistió", estado: "hecho", icono: "asistio" });
    if (r.estado === "no_asistio") out.push({ titulo: "No asistió", estado: "malo", icono: "no_asistio" });
  } else out.push({ titulo: "Confirmada", detalle: "Recibirás tu código QR de acceso.", estado: "pendiente", icono: "confirmada" });
  return out;
}
