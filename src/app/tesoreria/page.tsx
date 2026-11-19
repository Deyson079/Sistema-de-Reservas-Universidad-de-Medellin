import Link from "next/link";
import { Hourglass, CircleCheck, Wallet, Receipt, TriangleAlert, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { ahora, sumarDias, isoAFecha, moneda, fechaCorta, fechaLarga, haceCuanto } from "@/lib/formato";
import { vencerReservasPeriodico } from "@/lib/disponibilidad";
import { METODOS } from "@/lib/estados";
import { Kpi } from "@/components/ui/Varios";
import { ChipPago } from "@/components/ui/Chip";
import { LineaArea, BarrasH, TablaDatos } from "@/components/graficas/Graficas";

export const dynamic = "force-dynamic";

export default async function InicioTesoreria() {
  await vencerReservasPeriodico();
  const n = ahora();
  const inicioHoy = new Date(isoAFecha(n.iso).getTime() + 5 * 3600_000);
  const inicioMes = new Date(Date.UTC(Number(n.iso.slice(0, 4)), Number(n.iso.slice(5, 7)) - 1, 1, 5));
  const hace30 = new Date(isoAFecha(sumarDias(n.iso, -29)).getTime() + 5 * 3600_000);
  const [porValidar, viejos, validadosHoy, mes, mesAnt, vencidas, validados30, porMetodo, ultimos] = await Promise.all([
    db.pago.count({ where: { estado: "en_validacion" } }),
    db.pago.count({ where: { estado: "en_validacion", fecha: { lt: new Date(Date.now() - 24 * 3600_000) } } }),
    db.pago.count({ where: { estado: "validado", validadoEn: { gte: inicioHoy } } }),
    db.pago.aggregate({ _sum: { valor: true }, where: { estado: "validado", validadoEn: { gte: inicioMes } } }),
    db.pago.aggregate({ _sum: { valor: true }, where: { estado: "validado", validadoEn: { gte: new Date(inicioMes.getTime() - 30 * 86400_000), lt: new Date(Date.now() - 30 * 86400_000) } } }),
    db.factura.aggregate({ _count: true, _sum: { total: true }, where: { estado: "vencida" } }),
    db.pago.findMany({ where: { estado: "validado", validadoEn: { gte: hace30 } }, select: { valor: true, validadoEn: true } }),
    db.pago.groupBy({ by: ["metodo"], _sum: { valor: true }, _count: true, where: { estado: "validado", validadoEn: { gte: hace30 } } }),
    db.pago.findMany({ where: { estado: "en_validacion" }, include: { factura: { include: { reserva: { include: { usuario: true, cancha: true } } } } }, orderBy: { fecha: "asc" }, take: 5 }),
  ]);
  const dias = Array.from({ length: 30 }, (_, i) => sumarDias(n.iso, i - 29));
  const serie = dias.map((d) => ({ etiqueta: fechaLarga(d), corta: fechaCorta(d).slice(4), valor: validados30.filter((p) => new Date(p.validadoEn!.getTime() - 5 * 3600_000).toISOString().slice(0, 10) === d).reduce((a, p) => a + p.valor, 0) }));
  const recMes = mes._sum.valor ?? 0, recAnt = mesAnt._sum.valor ?? 0;
  const delta = recAnt ? Math.round(((recMes - recAnt) / recAnt) * 100) : 0;
  return (
    <>
      <div className="pag-cab"><div><h1>Tesorería</h1><p>Valida pagos, registra pagos en caja y gestiona facturas.</p></div><Link href="/tesoreria/pagos" className="btn btn-primario">Validar pagos ({porValidar})</Link></div>
      <div className="kpis">
        <Kpi titulo="Por validar" valor={porValidar} icono={<Hourglass className="i" />} tono="alerta" alerta={porValidar > 0} detalle={viejos ? <><TriangleAlert className="i i-sm" style={{ color: "var(--alerta)" }} />{viejos} llevan más de 24 horas</> : "Todos de menos de 24 horas"} />
        <Kpi titulo="Validados hoy" valor={validadosHoy} icono={<CircleCheck className="i" />} tono="exito" detalle={fechaLarga(n.iso)} />
        <Kpi titulo="Recaudo del mes" valor={moneda(recMes, false)} icono={<Wallet className="i" />} detalle={recAnt ? <><span className={delta >= 0 ? "sube" : "baja"}>{delta >= 0 ? "+" : ""}{delta} %</span> frente al mes anterior</> : "Pagos validados"} />
        <Kpi titulo="Facturas vencidas" valor={vencidas._count} icono={<Receipt className="i" />} tono="error" detalle={<><span className="baja">{moneda(vencidas._sum.total ?? 0, false)}</span> sin recaudar</>} />
      </div>
      <div className="graficas mt-2">
        <div className="graf"><h4>Recaudo de los últimos 30 días</h4><p className="nota">Pagos validados por día. Pasa el cursor sobre la línea para ver cada valor.</p><LineaArea datos={serie} /><TablaDatos titulo="Recaudo diario" columnas={["Día", "Recaudo"]} filas={serie.map((s) => [s.etiqueta, moneda(s.valor)])} /></div>
        <div className="graf"><h4>Pagos por método</h4><p className="nota">Valor validado en 30 días.</p><BarrasH formato={(v) => moneda(v, false)} items={porMetodo.sort((a, b) => (b._sum.valor ?? 0) - (a._sum.valor ?? 0)).map((m) => ({ etiqueta: METODOS[m.metodo]!.split(" ")[0]!, valor: m._sum.valor ?? 0 }))} /><TablaDatos titulo="Pagos por método" columnas={["Método", "Pagos", "Valor"]} filas={porMetodo.map((m) => [METODOS[m.metodo]!, m._count, moneda(m._sum.valor ?? 0)])} /></div>
      </div>
      <section className="tarjeta mt-2">
        <div className="fila-entre"><h2 className="t-tarjeta">Los más antiguos por validar</h2><Link href="/tesoreria/pagos" className="enlace">Ver todos<ChevronRight className="i i-sm" /></Link></div>
        <div className="tabla-scroll mt-1"><table className="t t-resp"><tbody>
          {ultimos.map((p) => (<tr key={p.id}><td className="cod" data-label="Factura">{p.factura.numero}</td><td data-label="Cliente">{p.factura.reserva.usuario.nombres} {p.factura.reserva.usuario.apellidos}</td><td data-label="Método">{METODOS[p.metodo]}</td><td className="num" data-label="Valor">{moneda(p.valor)}</td><td data-label="Recibido">{haceCuanto(p.fecha)}</td><td data-label="Estado"><ChipPago estado={p.estado} /></td><td data-label="" className="full"><Link className="btn btn-contorno btn-sm" href={`/tesoreria/pagos?ver=${p.id}`}>Revisar</Link></td></tr>))}
          {!ultimos.length && <tr><td className="texto-2">No hay pagos por validar. ¡Al día!</td></tr>}
        </tbody></table></div>
      </section>
    </>
  );
}
