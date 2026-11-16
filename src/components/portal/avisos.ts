import { Bell, CircleCheck, CircleX, Megaphone, Clock, Receipt, Info, Hourglass } from "lucide-react";
export const ICONO_AVISO: Record<string, [typeof Bell, string, string]> = {
  confirmada: [CircleCheck, "var(--exito-bg)", "var(--exito)"], pago_aprobado: [CircleCheck, "var(--exito-bg)", "var(--exito)"],
  pago_rechazado: [CircleX, "var(--error-bg)", "var(--error)"], cancelacion: [Megaphone, "var(--error-bg)", "var(--error)"],
  recordatorio: [Clock, "var(--amarillo-100)", "#7A6400"], factura: [Receipt, "var(--alerta-bg)", "var(--alerta)"],
  pago_recibido: [Info, "var(--info-bg)", "var(--info)"], vencida: [Hourglass, "var(--gris-200)", "var(--gris-700)"],
};
