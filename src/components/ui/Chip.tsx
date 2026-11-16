import { Circle, CircleCheck, Hourglass, ShieldCheck, CircleX, TimerOff, Ban, UserCheck, UserX, Wrench, Landmark, Wallet, Lock } from "lucide-react";
import { ESTADOS, type EstadoVisible } from "@/lib/estados";

const ICONOS = { libre: Circle, confirmada: CircleCheck, pendiente_pago: Hourglass, en_validacion: ShieldCheck, rechazada: CircleX, vencida: TimerOff, cancelada: Ban, asistio: UserCheck, no_asistio: UserX, fuera_de_servicio: Wrench };

export function ChipEstado({ estado, texto }: { estado: EstadoVisible | string; texto?: string }) {
  const e = (estado in ESTADOS ? estado : "libre") as EstadoVisible;
  const I = ICONOS[e];
  return (
    <span className={`chip chip--${e}`}>
      <I className="i" aria-hidden />
      {texto ?? ESTADOS[e]}
    </span>
  );
}

export function BadgeRol({ tipo, texto }: { tipo: "comunidad" | "externo" | "personal"; texto?: string }) {
  const I = tipo === "comunidad" ? Landmark : tipo === "externo" ? Wallet : Lock;
  return (
    <span className={`badge badge--${tipo}`}>
      <I className="i" aria-hidden />
      {texto ?? (tipo === "comunidad" ? "Comunidad Universidad de Medellín" : tipo === "externo" ? "Externo" : "Personal")}
    </span>
  );
}

const PAGO: Record<string, { e: EstadoVisible; t: string }> = {
  pendiente: { e: "pendiente_pago", t: "Pendiente" },
  en_validacion: { e: "en_validacion", t: "En validación" },
  validado: { e: "confirmada", t: "Validado" },
  rechazado: { e: "rechazada", t: "Rechazado" },
};
export function ChipPago({ estado }: { estado: string }) {
  const p = PAGO[estado] ?? PAGO.pendiente!;
  return <ChipEstado estado={p.e} texto={p.t} />;
}
const FACT: Record<string, { e: EstadoVisible; t: string }> = {
  sin_pagar: { e: "pendiente_pago", t: "Sin pagar" },
  pagada: { e: "confirmada", t: "Pagada" },
  vencida: { e: "vencida", t: "Vencida" },
  anulada: { e: "cancelada", t: "Anulada" },
};
export function ChipFactura({ estado }: { estado: string }) {
  const p = FACT[estado] ?? FACT.sin_pagar!;
  return <ChipEstado estado={p.e} texto={p.t} />;
}
