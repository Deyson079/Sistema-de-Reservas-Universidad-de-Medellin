import Link from "next/link";
import { Search, X, FileText, CircleCheck, TriangleAlert, ExternalLink, Download } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { moneda, fechaLarga, fechaHora, franja, haceCuanto } from "@/lib/formato";
import { METODOS } from "@/lib/estados";
import { urlArchivo } from "@/lib/storage";
import { validar, rechazar } from "@/lib/acciones-staff";
import { ChipPago, BadgeRol } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Paginacion, Vacio } from "@/components/ui/Varios";
import { BotonEnviar } from "@/components/ui/Cliente";

export const dynamic = "force-dynamic";

export default async function PagosPorValidar({ searchParams }: { searchParams: Promise<{ q?: string; metodo?: string; estado?: string; ver?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const estado = sp.estado ?? "en_validacion";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const where: Prisma.PagoWhereInput = {
    ...(estado !== "todos" ? { estado: estado as never } : {}),
    ...(sp.metodo ? { metodo: sp.metodo as never } : {}),
    ...(sp.q ? { OR: [{ referencia: { contains: sp.q, mode: "insensitive" } }, { factura: { numero: { contains: sp.q, mode: "insensitive" } } }, { factura: { reserva: { codigo: { contains: sp.q.toUpperCase() } } } }, { factura: { reserva: { usuario: { nombres: { contains: sp.q, mode: "insensitive" } } } } }] } : {}),
  };
  const [total, pagos] = await Promise.all([
    db.pago.count({ where }),
    db.pago.findMany({ where, include: { factura: { include: { reserva: { include: { usuario: { include: { facturacion: true } }, cancha: true } } } } }, orderBy: { fecha: estado === "en_validacion" ? "asc" : "desc" }, skip: (pagina - 1) * 15, take: 15 }),
  ]);
  const sel = sp.ver ? await db.pago.findUnique({ where: { id: sp.ver }, include: { factura: { include: { reserva: { include: { usuario: { include: { facturacion: true } }, cancha: true } } } }, validadoPor: true } }) : null;
  const urlComp = sel ? await urlArchivo(sel.comprobanteUrl) : null;
  const qs = new URLSearchParams(Object.entries({ q: sp.q, metodo: sp.metodo, estado: sp.estado }).filter(([, v]) => v) as [string, string][]).toString();
  const base = `/tesoreria/pagos${qs ? `?${qs}` : ""}`;
  const cerrar = base;
  return (
    <>
      <div className="pag-cab"><div><h1>Pagos por validar</h1><p>Revisa el comprobante, compáralo con la factura y valida o rechaza.</p></div><a className="btn btn-fantasma" href={`/api/exportar?tipo=pagos&formato=csv&estado=${estado}`}><Download className="i" />Exportar CSV</a></div>
      <form className="barra-filtros" action="/tesoreria/pagos">
        <div className="campo" style={{ flex: "2 1 260px" }}><label htmlFor="q">Buscar</label><div className="busqueda"><Search className="i" /><input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Factura, reserva, referencia o cliente" /></div></div>
        <div className="campo"><label htmlFor="estado">Estado</label><select id="estado" name="estado" defaultValue={estado} className="input"><option value="en_validacion">En validación</option><option value="pendiente">Pendiente (PSE)</option><option value="validado">Validados</option><option value="rechazado">Rechazados</option><option value="todos">Todos</option></select></div>
        <div className="campo"><label htmlFor="metodo">Método</label><select id="metodo" name="metodo" defaultValue={sp.metodo ?? ""} className="input"><option value="">Todos</option>{Object.entries(METODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <button className="btn btn-secundario" style={{ height: 44 }}>Aplicar</button>
        <span className="resumen-f">{total} pagos</span>
      </form>
      {pagos.length ? (
        <div className="tabla-wrap"><table className="t t-resp">
          <thead><tr><th>Factura</th><th>Cliente</th><th>Cancha y franja</th><th>Método</th><th className="num">Valor</th><th>Recibido</th><th>Estado</th><th /></tr></thead>
          <tbody>{pagos.map((p) => { const r = p.factura.reserva; const dif = p.valor !== p.factura.total; return (
            <tr key={p.id} style={sp.ver === p.id ? { background: "var(--rojo-50)" } : undefined}>
              <td className="cod" data-label="Factura">{p.factura.numero}<br /><small className="nota">{r.codigo}</small></td>
              <td data-label="Cliente"><div className="persona"><Avatar nombre={r.usuario.nombres} tipo="externo" tam="sm" /><div>{r.usuario.facturacion?.razonSocial ?? r.usuario.nombres}<small>{r.usuario.facturacion?.tipoPersona === "juridica" ? "NIT" : "C.C."} {r.usuario.facturacion?.nitCedula ?? r.usuario.documento}</small></div></div></td>
              <td data-label="Cancha">{r.cancha.nombre}<br /><small className="nota">{fechaLarga(r.fecha)}, {franja(r.horaInicio)}</small></td>
              <td data-label="Método">{METODOS[p.metodo]}{p.referencia && <><br /><small className="nota">Ref. {p.referencia}</small></>}</td>
              <td className="num t-num" data-label="Valor" style={{ fontSize: 18 }}>{moneda(p.valor, false)}{dif && <><br /><small style={{ color: "var(--error)", fontFamily: "var(--f-texto)", fontSize: 12 }}>≠ factura</small></>}</td>
              <td data-label="Recibido">{haceCuanto(p.fecha)}</td>
              <td data-label="Estado"><ChipPago estado={p.estado} /></td>
              <td data-label="" className="full"><Link className={`btn btn-sm ${p.estado === "en_validacion" ? "btn-contorno" : "btn-fantasma"}`} href={`${base}${base.includes("?") ? "&" : "?"}ver=${p.id}${pagina > 1 ? `&pagina=${pagina}` : ""}`} scroll={false}>{p.estado === "en_validacion" ? "Revisar" : "Ver"}</Link></td>
            </tr>); })}</tbody>
        </table></div>
      ) : <Vacio titulo="No hay pagos con estos filtros" texto={estado === "en_validacion" ? "Estás al día: no hay pagos esperando validación." : "Prueba con otros filtros."} />}
      <Paginacion pagina={pagina} total={total} porPagina={15} base={base} etiqueta="pagos" />

      {sel && (() => { const r = sel.factura.reserva; const dif = sel.valor !== sel.factura.total; const esImg = !!urlComp && /\.(png|jpe?g)(\?|$)/i.test(urlComp); return (
        <div className="drawer-capa" role="dialog" aria-modal="true" aria-labelledby="dt">
          <Link href={cerrar} scroll={false} aria-label="Cerrar" style={{ flex: 1 }} />
          <aside className="drawer">
            <div className="cab"><h3 id="dt">Pago de {sel.factura.numero}</h3><Link href={cerrar} scroll={false} className="cerrar" aria-label="Cerrar"><X className="i" /></Link></div>
            <div className="cuerpo">
              <div className="comprobante" style={{ height: urlComp ? 240 : 120 }}>
                {urlComp ? (esImg ? <img src={urlComp} alt="Comprobante de pago" /> : <a className="btn btn-fantasma" href={urlComp} target="_blank"><FileText className="i" />Abrir comprobante (PDF)<ExternalLink className="i i-sm" /></a>)
                  : <div style={{ textAlign: "center", padding: 12 }}><FileText className="i i-lg" style={{ margin: "0 auto 6px" }} />Pago en línea por {METODOS[sel.metodo]}<br /><span className="mini">Sin comprobante adjunto</span></div>}
              </div>
              {urlComp && <a href={urlComp} target="_blank" className="enlace-simple chico" style={{ display: "inline-flex", gap: 6, alignItems: "center", minHeight: 36 }}>Ver en tamaño completo<ExternalLink className="i i-sm" /></a>}
              <dl className="dl mt-1" style={{ fontSize: 14 }}>
                <dt>Valor del pago</dt><dd>{moneda(sel.valor)}</dd>
                <dt>Total de la factura</dt><dd>{moneda(sel.factura.total)}</dd>
                <dt>Método</dt><dd>{METODOS[sel.metodo]}</dd>
                {sel.banco && <><dt>Banco</dt><dd>{sel.banco}</dd></>}
                <dt>Referencia</dt><dd>{sel.referencia ?? "—"}</dd>
                {sel.fechaPago && <><dt>Fecha del pago</dt><dd>{fechaLarga(sel.fechaPago)}</dd></>}
                <dt>Enviado</dt><dd>{fechaHora(sel.fecha)}</dd>
              </dl>
              <div className={`aviso mt-2 ${dif ? "aviso--error" : "aviso--exito"}`}>{dif ? <TriangleAlert className="i" /> : <CircleCheck className="i" />}<span>{dif ? `El valor no coincide: faltan ${moneda(sel.factura.total - sel.valor)}.` : "El valor coincide con la factura."}</span></div>
              <h4 style={{ margin: "20px 0 8px" }}>Cliente y reserva</h4>
              <div className="persona" style={{ marginBottom: 10 }}><Avatar nombre={r.usuario.nombres} tipo="externo" tam="sm" /><div><b>{r.usuario.facturacion?.razonSocial ?? r.usuario.nombres}</b><small>{r.usuario.correo} · {r.usuario.celular}</small></div><BadgeRol tipo="externo" /></div>
              <dl className="dl" style={{ fontSize: 14 }}><dt>Reserva</dt><dd>{r.codigo}</dd><dt>Escenario</dt><dd>{r.cancha.nombre}</dd><dt>Franja</dt><dd>{fechaLarga(r.fecha)}, {franja(r.horaInicio)}</dd>{r.limitePago && <><dt>Límite de pago</dt><dd>{fechaHora(r.limitePago)}</dd></>}</dl>
              {sel.estado !== "en_validacion" && <div className="aviso aviso--neutro mt-2"><span>{sel.estado === "validado" ? "Validado" : "Rechazado"} por {sel.validadoPor?.nombre ?? "Tesorería"} {sel.validadoEn ? `el ${fechaHora(sel.validadoEn)}` : ""}{sel.motivoRechazo ? `. Motivo: ${sel.motivoRechazo}` : ""}</span></div>}
              {sel.estado === "en_validacion" && (
                <form action={rechazar} id="f-rechazo" className="form mt-3" style={{ borderTop: "1px solid var(--borde)", paddingTop: 16 }}>
                  <input type="hidden" name="pagoId" value={sel.id} /><input type="hidden" name="volver" value={base} />
                  <div className="campo"><label htmlFor="motivo">Motivo del rechazo <span className="opc">(obligatorio para rechazar; el cliente lo verá)</span></label>
                    <select id="motivo" name="motivo" className="input" defaultValue={dif ? `El valor del comprobante (${moneda(sel.valor, false)}) no coincide con el total de la factura (${moneda(sel.factura.total, false)})` : ""}><option value="">Elige un motivo</option>{dif && <option>{`El valor del comprobante (${moneda(sel.valor, false)}) no coincide con el total de la factura (${moneda(sel.factura.total, false)})`}</option>}<option>El comprobante no es legible</option><option>La referencia no aparece en el extracto bancario</option><option>El pago no se hizo a la cuenta de la Universidad de Medellín</option><option>Comprobante duplicado</option></select></div>
                  <textarea name="detalle" className="input" placeholder="Detalle adicional (opcional)" style={{ minHeight: 64 }} aria-label="Detalle adicional" />
                </form>
              )}
            </div>
            {sel.estado === "en_validacion" && (
              <div className="acciones">
                <BotonEnviar form="f-rechazo" className="btn btn-contorno" style={{ color: "var(--error)" }}>Rechazar</BotonEnviar>
                <form action={validar} style={{ flex: 1, display: "flex" }}><input type="hidden" name="pagoId" value={sel.id} /><input type="hidden" name="volver" value={base} /><BotonEnviar className="btn btn-primario ancho" style={{ background: "var(--exito)", boxShadow: "none" }}><CircleCheck className="i" />Validar pago</BotonEnviar></form>
              </div>
            )}
          </aside>
        </div>
      ); })()}
    </>
  );
}
