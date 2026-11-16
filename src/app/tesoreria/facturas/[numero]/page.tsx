import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ExternalLink, Fingerprint } from "lucide-react";
import { db } from "@/lib/db";
import { moneda, fechaLarga, fechaHora, franja } from "@/lib/formato";
import { METODOS } from "@/lib/estados";
import { urlArchivo } from "@/lib/storage";
import { ChipFactura, ChipEstado, ChipPago } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

const ACCIONES: Record<string, string> = { crear_reserva: "Creó la reserva", registrar_pago: "Registró un pago", validar_pago: "Validó el pago", rechazar_pago: "Rechazó el pago", cancelar_reserva: "Canceló la reserva", pse_confirmado: "PSE confirmó el pago" };

export default async function DetalleFactura({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const f = await db.factura.findUnique({ where: { numero }, include: { reserva: { include: { usuario: { include: { facturacion: true } }, cancha: true } }, pagos: { include: { validadoPor: true }, orderBy: { fecha: "desc" } } } });
  if (!f) notFound();
  const r = f.reserva;
  const historial = await db.auditoria.findMany({ where: { OR: [{ entidadId: { in: [r.id, ...f.pagos.map((p) => p.id)] } }, { detalle: { contains: f.numero } }] }, orderBy: { fecha: "desc" } });
  const comps = await Promise.all(f.pagos.map((p) => urlArchivo(p.comprobanteUrl)));
  const rut = await urlArchivo(r.usuario.facturacion?.rutUrl);
  return (
    <>
      <Link href="/tesoreria/facturas" className="miga mt-2"><ArrowLeft className="i i-sm" />Facturas</Link>
      <div className="pag-cab" style={{ marginTop: 4 }}><div><span className="fila"><ChipFactura estado={f.estado} /><ChipEstado estado={r.estado} /></span><h1 style={{ marginTop: 10 }}>{f.numero}</h1><p>{r.usuario.facturacion?.razonSocial ?? r.usuario.nombres} · {moneda(f.total)}</p></div><Link className="btn btn-secundario" href={`/factura/${f.numero}`}><FileText className="i" />Ver factura imprimible</Link></div>
      <div className="grid-principal">
        <div style={{ display: "grid", gap: 16 }}>
          <section className="tarjeta"><h2 className="t-tarjeta">Pagos</h2>
            {f.pagos.length ? <div className="tabla-scroll mt-1"><table className="t t-resp"><thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th className="num">Valor</th><th>Estado</th><th>Revisó</th><th /></tr></thead><tbody>
              {f.pagos.map((p, i) => <tr key={p.id}><td data-label="Fecha">{fechaHora(p.fecha)}</td><td data-label="Método">{METODOS[p.metodo]}</td><td data-label="Referencia">{p.referencia ?? "—"}</td><td className="num" data-label="Valor">{moneda(p.valor)}</td><td data-label="Estado"><ChipPago estado={p.estado} />{p.motivoRechazo && <div className="mini" style={{ color: "var(--error)" }}>{p.motivoRechazo}</div>}</td><td data-label="Revisó">{p.validadoPor?.nombre ?? "—"}{p.validadoEn && <><br /><small className="nota">{fechaHora(p.validadoEn)}</small></>}</td><td data-label="" className="full">{comps[i] && <a className="btn btn-fantasma btn-sm" href={comps[i]!} target="_blank">Comprobante<ExternalLink className="i i-sm" /></a>}{p.estado === "en_validacion" && <Link className="btn btn-contorno btn-sm" href={`/tesoreria/pagos?ver=${p.id}`}>Revisar</Link>}</td></tr>)}
            </tbody></table></div> : <p className="chico texto-2">Aún no hay pagos para esta factura.</p>}
          </section>
          <section className="tarjeta"><h2 className="t-tarjeta" style={{ marginBottom: 12 }}>Historial de acciones</h2>
            <ol className="timeline">{historial.map((h) => <li key={h.id} className="hecho"><span className="pt" style={{ background: "var(--petroleo-700)", borderColor: "var(--petroleo-700)" }}><Fingerprint className="i i-sm" /></span><div><b>{ACCIONES[h.accion] ?? h.accion.replace(/_/g, " ")}</b><small>{h.actor} ({h.actorRol}) · {fechaHora(h.fecha)}{h.detalle ? ` · ${h.detalle}` : ""}</small></div></li>)}{!historial.length && <li><span className="pt" /><div><small>Sin acciones registradas.</small></div></li>}</ol>
          </section>
        </div>
        <aside className="tarjeta">
          <h2 className="t-tarjeta">Factura</h2>
          <dl className="dl mt-2" style={{ fontSize: 14 }}><dt>Emitida</dt><dd>{fechaHora(f.creadaEn)}</dd><dt>Vence</dt><dd>{fechaHora(f.venceEn)}</dd><dt>Valor</dt><dd>{moneda(f.valor)}</dd><dt>IVA</dt><dd>{f.iva ? moneda(f.iva) : "No aplica"}</dd><dt>Total</dt><dd className="total">{moneda(f.total)}</dd><hr />
            <dt>Cliente</dt><dd>{r.usuario.facturacion?.razonSocial ?? r.usuario.nombres}</dd><dt>NIT o cédula</dt><dd>{r.usuario.facturacion?.nitCedula ?? r.usuario.documento}</dd><dt>Correo</dt><dd style={{ wordBreak: "break-all" }}>{r.usuario.correo}</dd><dt>RUT</dt><dd>{rut ? <a href={rut} target="_blank" className="enlace-simple">Ver PDF</a> : "Pendiente"}</dd><hr />
            <dt>Reserva</dt><dd>{r.codigo}</dd><dt>Escenario</dt><dd>{r.cancha.nombre}</dd><dt>Franja</dt><dd>{fechaLarga(r.fecha)}, {franja(r.horaInicio)}</dd></dl>
        </aside>
      </div>
    </>
  );
}
