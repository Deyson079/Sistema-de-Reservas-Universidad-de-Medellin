import { Search, Info } from "lucide-react";
import { db } from "@/lib/db";
import { moneda, fechaLarga, franja, fechaHora } from "@/lib/formato";
import { ChipFactura, ChipEstado } from "@/components/ui/Chip";
import { FormCaja } from "./formulario";

export const dynamic = "force-dynamic";

export default async function Caja({ searchParams }: { searchParams: Promise<{ factura?: string }> }) {
  const { factura } = await searchParams;
  const f = factura ? await db.factura.findFirst({ where: { OR: [{ numero: factura.toUpperCase() }, { reserva: { codigo: factura.toUpperCase() } }] }, include: { reserva: { include: { usuario: { include: { facturacion: true } }, cancha: true } } } }) : null;
  const recientes = await db.pago.findMany({ where: { metodo: "caja" }, include: { factura: true, validadoPor: true }, orderBy: { fecha: "desc" }, take: 6 });
  return (
    <>
      <div className="pag-cab"><div><h1>Registrar pago en caja</h1><p>Para clientes que pagan en la caja de la Universidad. El pago queda validado y la reserva confirmada.</p></div></div>
      <div className="grid-principal">
        <div style={{ display: "grid", gap: 16 }}>
          <form className="tarjeta form" action="/tesoreria/caja">
            <div className="campo" style={{ flex: 1 }}><label htmlFor="factura">Busca la factura o la reserva</label><div className="busqueda"><Search className="i" /><input id="factura" name="factura" defaultValue={factura} className="input" placeholder="FV-2026-000123 o RD-24817" /></div></div>
            <div><button className="btn btn-secundario">Buscar</button></div>
          </form>
          {factura && !f && <div className="aviso aviso--error"><Info className="i" /><span>No encontramos una factura o reserva con «{factura}».</span></div>}
          {f && (
            <div className="tarjeta">
              <div className="fila-entre"><h2 className="t-h4" style={{ margin: 0 }}>{f.numero}</h2><span className="fila"><ChipFactura estado={f.estado} /><ChipEstado estado={f.reserva.estado} /></span></div>
              <dl className="dl mt-2"><dt>Cliente</dt><dd>{f.reserva.usuario.facturacion?.razonSocial ?? f.reserva.usuario.nombres}</dd><dt>Reserva</dt><dd>{f.reserva.codigo} · {f.reserva.cancha.nombre}</dd><dt>Franja</dt><dd>{fechaLarga(f.reserva.fecha)}, {franja(f.reserva.horaInicio)}</dd><dt>Total</dt><dd className="total">{moneda(f.total)}</dd></dl>
              {f.estado !== "sin_pagar" && <div className="aviso aviso--alerta mt-2"><Info className="i" /><span>Esta factura está {f.estado.replace("_", " ")} y no admite pagos.</span></div>}
            </div>
          )}
          <div className="tarjeta"><h2 className="t-tarjeta" style={{ marginBottom: 16 }}>Datos del pago</h2><FormCaja numero={f?.numero} total={f?.total} /></div>
        </div>
        <aside className="tarjeta">
          <h2 className="t-tarjeta">Últimos pagos en caja</h2>
          <div className="lista-avisos mt-1">{recientes.map((p) => <div key={p.id} className="it"><span className="ic" style={{ background: "var(--exito-bg)", color: "var(--exito)" }}>$</span><div><b>{p.factura.numero}</b><span>{moneda(p.valor)} · recibo {p.referencia}</span></div><small>{fechaHora(p.fecha).split(",")[0]}</small></div>)}{!recientes.length && <p className="chico texto-2">Aún no hay pagos en caja.</p>}</div>
        </aside>
      </div>
    </>
  );
}
