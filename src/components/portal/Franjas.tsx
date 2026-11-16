import Link from "next/link";
import { Circle, Check, Lock, Hourglass, CircleCheck, Wrench, Clock } from "lucide-react";
import type { Franja } from "@/lib/disponibilidad";
import { hora } from "@/lib/formato";

const MAP = {
  libre: { c: "franja--libre", i: Circle, t: "Libre" },
  ocupada: { c: "franja--ocupada", i: Lock, t: "Ocupada" },
  pendiente: { c: "franja--pendiente", i: Hourglass, t: "Pendiente de pago" },
  tuya: { c: "franja--tuya", i: CircleCheck, t: "Tu reserva" },
  fuera: { c: "franja--fuera", i: Wrench, t: "Fuera de servicio" },
  pasada: { c: "franja--pasada", i: Clock, t: "Pasada" },
};

export function CuadriculaFranjas({ franjas, sel, href }: { franjas: Franja[]; sel?: number; href: (h: number) => string }) {
  return (
    <div className="cuadricula" role="list" aria-label="Franjas de 1 hora">
      {franjas.map((f) => {
        const s = f.estado === "libre" && f.hora === sel;
        const m = MAP[f.estado];
        const I = s ? Check : m.i;
        const cont = <><span className="h">{hora(f.hora)}</span><span className="e"><I className="i" aria-hidden />{s ? "Tu selección" : m.t}</span></>;
        const lab = `${hora(f.hora)} a ${hora(f.hora + 1)}: ${s ? "seleccionada" : m.t}${f.motivo ? `, ${f.motivo}` : ""}`;
        return f.estado === "libre"
          ? <Link role="listitem" key={f.hora} href={href(f.hora)} scroll={false} className={`franja ${s ? "franja--sel pop" : m.c}`} aria-label={lab} aria-current={s ? "true" : undefined}>{cont}</Link>
          : <div role="listitem" key={f.hora} className={`franja ${m.c}`} aria-label={lab} title={f.motivo}>{cont}</div>;
      })}
    </div>
  );
}

export function LeyendaFranjas() {
  return (
    <div className="leyenda-f" aria-label="Leyenda de estados">
      <span><i><Circle style={{ color: "var(--exito)" }} /></i>Libre</span>
      <span><i style={{ background: "repeating-linear-gradient(135deg,#F5F6F7 0 3px,#E4E7EA 3px 6px)" }}><Lock /></i>Ocupada</span>
      <span><i style={{ background: "var(--alerta-bg)", borderColor: "#EBC890" }}><Hourglass style={{ color: "#7A4800" }} /></i>Pendiente de pago</span>
      <span><i style={{ background: "var(--petroleo-700)", borderColor: "var(--petroleo-700)", color: "#fff" }}><CircleCheck /></i>Tu reserva</span>
      <span><i style={{ background: "var(--tinta)", borderColor: "var(--tinta)", color: "var(--amarillo-400)" }}><Wrench /></i>Fuera de servicio</span>
      <span><i style={{ borderStyle: "dashed" }}><Clock style={{ color: "var(--gris-500)" }} /></i>Pasada</span>
    </div>
  );
}
