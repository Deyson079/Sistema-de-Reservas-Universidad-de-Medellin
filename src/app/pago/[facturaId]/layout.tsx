import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { cargarFactura } from "../comun";
import { moneda, fechaLarga, franja, fechaHora } from "@/lib/formato";
import { Ilustracion } from "@/components/Ilustracion";

export default async function LayoutPago({ children, params }: { children: React.ReactNode; params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { f } = await cargarFactura(facturaId);
  const r = f.reserva;
  return (
    <div className="portal">
      <header className="p-cab"><div className="contenedor">
        <Link href={`/portal/reservas/${r.codigo}`} className="miga"><ArrowLeft className="i i-sm" />Volver a la reserva</Link>
        <img src="/brand/logo-color.png" alt="Universidad de Medellín" style={{ height: 36, margin: "0 auto" }} />
        <span className="seguro"><Lock className="i i-sm" />Pago seguro</span>
      </div></header>
      <main id="contenido" className="contenedor pago-wrap">
        <div>{children}</div>
        <aside className="tarjeta resumen-lateral" aria-label="Resumen del pago">
          <div className="foto grano"><Ilustracion tipo={r.cancha.ilustracion} /></div>
          <span className="mini texto-2">Factura {f.numero}</span>
          <h2 className="t-h3" style={{ margin: "4px 0 14px" }}>Reserva {r.codigo}</h2>
          <dl className="dl" style={{ fontSize: 14 }}>
            <dt>Concepto</dt><dd>Alquiler de escenario deportivo (1 hora)</dd>
            <dt>Escenario</dt><dd>{r.cancha.nombre}</dd>
            <dt>Fecha</dt><dd>{fechaLarga(r.fecha)}</dd>
            <dt>Hora</dt><dd>{franja(r.horaInicio, r.horaFin)}</dd>
            <hr />
            <dt>Valor</dt><dd>{moneda(f.valor)}</dd>
            <dt>IVA</dt><dd>{f.iva ? moneda(f.iva) : "No aplica"}</dd>
            <dt className="negrita" style={{ color: "var(--tinta)", alignSelf: "center" }}>Total</dt><dd className="total">{moneda(f.total)}</dd>
          </dl>
          {r.limitePago && f.estado === "sin_pagar" && <div className="aviso aviso--alerta mt-2" style={{ fontSize: 13 }}>Paga antes del {fechaHora(r.limitePago)}.</div>}
        </aside>
      </main>
    </div>
  );
}
