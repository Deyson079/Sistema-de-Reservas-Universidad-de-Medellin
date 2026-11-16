import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, CreditCard, Receipt, Wallet, Hourglass } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaCorta, fechaHora, moneda, franja } from "@/lib/formato";
import { METODOS } from "@/lib/estados";
import { ChipFactura, ChipPago } from "@/components/ui/Chip";
import { Kpi, Vacio, Tabs } from "@/components/ui/Varios";

export const metadata = { title: "Pagos y facturas" };
export const dynamic = "force-dynamic";

export default async function MisPagos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = "facturas" } = await searchParams;
  const u = await requireUsuario();
  if (u.tipo !== "externo") redirect("/portal");
  const facturas = await db.factura.findMany({ where: { reserva: { usuarioId: u.id } }, include: { reserva: { include: { cancha: true } }, pagos: { orderBy: { fecha: "desc" } } }, orderBy: { creadaEn: "desc" } });
  const pagos = facturas.flatMap((f) => f.pagos.map((p) => ({ ...p, factura: f })));
  const pagado = facturas.filter((f) => f.estado === "pagada").reduce((a, f) => a + f.total, 0);
  const pendiente = facturas.filter((f) => f.estado === "sin_pagar").reduce((a, f) => a + f.total, 0);
  return (
    <div className="contenedor">
      <div className="pag-cab"><div><h1>Pagos y facturas</h1><p>Tu historial de facturas y pagos. Descarga cada factura en PDF.</p></div></div>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi titulo="Pagado" valor={moneda(pagado, false)} icono={<Wallet className="i" />} tono="exito" detalle={`${facturas.filter((f) => f.estado === "pagada").length} facturas pagadas`} />
        <Kpi titulo="Por pagar" valor={moneda(pendiente, false)} icono={<Hourglass className="i" />} tono="alerta" alerta={pendiente > 0} detalle={`${facturas.filter((f) => f.estado === "sin_pagar").length} facturas sin pagar`} />
        <Kpi titulo="Facturas" valor={facturas.length} icono={<Receipt className="i" />} detalle="Desde que creaste tu cuenta" />
      </div>
      <div className="mt-4"><Tabs activo={ver} items={[{ id: "facturas", texto: "Facturas", href: "/portal/pagos", cuenta: facturas.length }, { id: "pagos", texto: "Pagos", href: "/portal/pagos?ver=pagos", cuenta: pagos.length }]} /></div>
      {ver === "facturas" ? (facturas.length ? (
        <div className="tabla-wrap mt-2"><table className="t t-resp">
          <thead><tr><th>Factura</th><th>Reserva</th><th>Fecha</th><th className="num">Total</th><th>Estado</th><th /></tr></thead>
          <tbody>{facturas.map((f) => (
            <tr key={f.id}>
              <td className="cod" data-label="Factura">{f.numero}</td>
              <td data-label="Reserva"><Link href={`/portal/reservas/${f.reserva.codigo}`} className="enlace-simple" style={{ fontWeight: 600 }}>{f.reserva.cancha.nombre}</Link><br /><small className="nota">{fechaCorta(f.reserva.fecha)}, {franja(f.reserva.horaInicio)}</small></td>
              <td data-label="Emitida">{fechaCorta(f.creadaEn)}</td>
              <td className="num t-num" data-label="Total" style={{ fontSize: 18 }}>{moneda(f.total, false)}</td>
              <td data-label="Estado"><ChipFactura estado={f.estado} /></td>
              <td data-label="" className="full"><div className="fila" style={{ justifyContent: "flex-end" }}>{f.estado === "sin_pagar" && ["pendiente_pago", "rechazada"].includes(f.reserva.estado) && <Link className="btn btn-primario btn-sm" href={`/pago/${f.id}`}><CreditCard className="i i-sm" />Pagar</Link>}<Link className="btn btn-fantasma btn-sm" href={`/factura/${f.numero}`}><Download className="i i-sm" />PDF</Link></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <div className="mt-3"><Vacio titulo="Aún no tienes facturas" texto="Cuando reserves, aquí verás la factura de cada franja." accion={<Link href="/portal/reservar" className="btn btn-primario">Reservar una cancha</Link>} /></div>)
        : (pagos.length ? (
          <div className="tabla-wrap mt-2"><table className="t t-resp">
            <thead><tr><th>Fecha</th><th>Factura</th><th>Método</th><th>Referencia</th><th className="num">Valor</th><th>Estado</th></tr></thead>
            <tbody>{pagos.map((p) => (
              <tr key={p.id}><td data-label="Fecha">{fechaHora(p.fecha)}</td><td className="cod" data-label="Factura">{p.factura.numero}</td><td data-label="Método">{METODOS[p.metodo]}</td><td data-label="Referencia">{p.referencia ?? "—"}</td><td className="num" data-label="Valor">{moneda(p.valor)}</td><td data-label="Estado"><ChipPago estado={p.estado} />{p.motivoRechazo && <div className="mini" style={{ color: "var(--error)", marginTop: 4 }}>{p.motivoRechazo}</div>}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <div className="mt-3"><Vacio titulo="Aún no has hecho pagos" texto="Tus pagos en línea y comprobantes aparecerán aquí." /></div>)}
    </div>
  );
}
