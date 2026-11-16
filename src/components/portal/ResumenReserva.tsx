import { Users, Ruler, MapPin, CalendarDays, Clock } from "lucide-react";
import type { Cancha } from "@prisma/client";
import { Ilustracion } from "@/components/Ilustracion";
import { fechaLarga, franja, moneda } from "@/lib/formato";

export function ResumenReserva({ cancha, fecha, hora, externo, iva = 0, children }: { cancha: Cancha; fecha: string; hora: number; externo: boolean; iva?: number; children?: React.ReactNode }) {
  const ivaV = Math.round((cancha.tarifaHora * iva) / 100);
  return (
    <aside className="tarjeta resumen-lateral" aria-label="Resumen de la reserva">
      <div className="foto grano"><Ilustracion tipo={cancha.ilustracion} /></div>
      <h2 className="t-h3" style={{ margin: "0 0 12px" }}>{cancha.nombre}</h2>
      <dl className="dl">
        <dt><span className="fila" style={{ gap: 6 }}><CalendarDays className="i i-sm" />Fecha</span></dt><dd>{fechaLarga(fecha)}</dd>
        <dt><span className="fila" style={{ gap: 6 }}><Clock className="i i-sm" />Hora</span></dt><dd>{franja(hora)}</dd>
        <dt><span className="fila" style={{ gap: 6 }}><Users className="i i-sm" />Capacidad</span></dt><dd>Hasta {cancha.capacidad} personas</dd>
        <dt><span className="fila" style={{ gap: 6 }}><Ruler className="i i-sm" />Medidas</span></dt><dd>{cancha.dimensiones}</dd>
        <dt><span className="fila" style={{ gap: 6 }}><MapPin className="i i-sm" />Ubicación</span></dt><dd style={{ fontWeight: 400, fontSize: 14 }}>{cancha.ubicacion}</dd>
        <hr />
        {externo ? (<>
          <dt>Valor por hora</dt><dd>{moneda(cancha.tarifaHora)}</dd>
          {ivaV > 0 && <><dt>IVA ({iva} %)</dt><dd>{moneda(ivaV)}</dd></>}
          <dt className="negrita" style={{ color: "var(--tinta)", alignSelf: "center" }}>Total</dt><dd className="total">{moneda(cancha.tarifaHora + ivaV)}</dd>
        </>) : (<><dt className="negrita" style={{ color: "var(--tinta)", alignSelf: "center" }}>Valor</dt><dd className="total" style={{ color: "var(--petroleo-700)" }}>Sin costo</dd></>)}
      </dl>
      {children}
    </aside>
  );
}
