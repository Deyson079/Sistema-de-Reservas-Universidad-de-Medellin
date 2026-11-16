import Link from "next/link";
import { Clock, Users, ChevronRight, Receipt } from "lucide-react";
import type { Reserva, Cancha, Factura } from "@prisma/client";
import { Ilustracion } from "@/components/Ilustracion";
import { ChipEstado } from "@/components/ui/Chip";
import { franja, moneda, diaCorto, fechaLarga } from "@/lib/formato";

export function TarjetaReserva({ r }: { r: Reserva & { cancha: Cancha; factura: Factura | null } }) {
  return (
    <Link href={`/portal/reservas/${r.codigo}`} className="res-card">
      <div className="mini-foto grano"><span className="fecha-b"><span>{diaCorto(r.fecha)}</span><b>{r.fecha.getUTCDate()}</b></span><Ilustracion tipo={r.cancha.ilustracion} /></div>
      <div>
        <ChipEstado estado={r.estado} />
        <h3>{r.cancha.nombre}</h3>
        <div className="meta"><span>{fechaLarga(r.fecha)}</span><span><Clock className="i" />{franja(r.horaInicio, r.horaFin)}</span><span><Users className="i" />{r.participantes}</span>{r.factura && <span><Receipt className="i" />{moneda(r.factura.total)}</span>}</div>
      </div>
      <div className="acc"><span className="mini texto-2">{r.codigo}</span><span className="btn btn-fantasma btn-sm">Ver detalle<ChevronRight className="i i-sm" /></span></div>
    </Link>
  );
}
