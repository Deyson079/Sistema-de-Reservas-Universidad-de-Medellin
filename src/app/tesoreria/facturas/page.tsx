import Link from "next/link";
import { Search, Download, FileSpreadsheet } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { moneda, fechaCorta, franja } from "@/lib/formato";
import { vencerReservas } from "@/lib/disponibilidad";
import { ChipFactura } from "@/components/ui/Chip";
import { Tabs, Paginacion, Vacio } from "@/components/ui/Varios";

export const dynamic = "force-dynamic";

export default async function Facturas({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; pagina?: string }> }) {
  const sp = await searchParams;
  await vencerReservas();
  const tab = sp.tab ?? "sin_pagar";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const busq: Prisma.FacturaWhereInput = sp.q ? { OR: [{ numero: { contains: sp.q, mode: "insensitive" } }, { reserva: { codigo: { contains: sp.q.toUpperCase() } } }, { reserva: { usuario: { nombres: { contains: sp.q, mode: "insensitive" } } } }, { reserva: { usuario: { facturacion: { nitCedula: { contains: sp.q } } } } }] } : {};
  const est = ["sin_pagar", "pagada", "vencida"] as const;
  const cuentas = await Promise.all([...est.map((e) => db.factura.count({ where: { ...busq, estado: e } })), db.factura.count({ where: busq })]);
  const where = { ...busq, ...(tab !== "todas" ? { estado: tab as never } : {}) };
  const [total, facturas, suma] = await Promise.all([
    db.factura.count({ where }),
    db.factura.findMany({ where, include: { reserva: { include: { usuario: { include: { facturacion: true } }, cancha: true } } }, orderBy: { creadaEn: "desc" }, skip: (pagina - 1) * 20, take: 20 }),
    db.factura.aggregate({ where, _sum: { total: true } }),
  ]);
  const href = (t: string) => `/tesoreria/facturas?tab=${t}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`;
  return (
    <>
      <div className="pag-cab"><div><h1>Facturas</h1><p>Consulta, descarga y exporta las facturas de las reservas de externos.</p></div>
        <div className="acciones"><a className="btn btn-fantasma" href={`/api/exportar?tipo=facturas&formato=csv&estado=${tab}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}><Download className="i" />CSV</a><a className="btn btn-secundario" href={`/api/exportar?tipo=facturas&formato=xls&estado=${tab}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}><FileSpreadsheet className="i" />Excel</a></div></div>
      <Tabs activo={tab} items={[{ id: "sin_pagar", texto: "Sin pagar", href: href("sin_pagar"), cuenta: cuentas[0], alerta: true }, { id: "pagada", texto: "Pagadas", href: href("pagada"), cuenta: cuentas[1] }, { id: "vencida", texto: "Vencidas", href: href("vencida"), cuenta: cuentas[2] }, { id: "todas", texto: "Todas", href: href("todas"), cuenta: cuentas[3] }]} />
      <form className="barra-filtros" action="/tesoreria/facturas"><input type="hidden" name="tab" value={tab} />
        <div className="campo" style={{ flex: "1 1 320px", maxWidth: 420 }}><label htmlFor="q">Buscar</label><div className="busqueda"><Search className="i" /><input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Número, reserva, cliente o NIT" /></div></div>
        <button className="btn btn-secundario" style={{ height: 44 }}>Buscar</button>
        <span className="resumen-f">{total} facturas · {moneda(suma._sum.total ?? 0)}</span>
      </form>
      {facturas.length ? (
        <div className="tabla-wrap"><table className="t t-resp">
          <thead><tr><th>Número</th><th>Cliente</th><th>Reserva</th><th>Emitida</th><th>Vence</th><th className="num">Total</th><th>Estado</th><th /></tr></thead>
          <tbody>{facturas.map((f) => (
            <tr key={f.id}>
              <td className="cod" data-label="Número"><Link href={`/tesoreria/facturas/${f.numero}`} style={{ color: "inherit" }}>{f.numero}</Link></td>
              <td data-label="Cliente">{f.reserva.usuario.facturacion?.razonSocial ?? f.reserva.usuario.nombres}<br /><small className="nota">{f.reserva.usuario.facturacion?.nitCedula ?? f.reserva.usuario.documento}</small></td>
              <td data-label="Reserva">{f.reserva.cancha.nombre}<br /><small className="nota">{fechaCorta(f.reserva.fecha)}, {franja(f.reserva.horaInicio)}</small></td>
              <td data-label="Emitida">{fechaCorta(f.creadaEn)}</td><td data-label="Vence">{fechaCorta(f.venceEn)}</td>
              <td className="num t-num" data-label="Total" style={{ fontSize: 18 }}>{moneda(f.total, false)}</td>
              <td data-label="Estado"><ChipFactura estado={f.estado} /></td>
              <td data-label="" className="full"><Link className="btn btn-fantasma btn-sm" href={`/tesoreria/facturas/${f.numero}`}>Detalle</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <Vacio titulo="No hay facturas aquí" texto="Prueba con otra pestaña o búsqueda." />}
      <Paginacion pagina={pagina} total={total} porPagina={20} base={href(tab)} etiqueta="facturas" />
    </>
  );
}
