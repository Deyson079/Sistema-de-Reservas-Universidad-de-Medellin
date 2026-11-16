import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { fechaLarga, fechaHora, franja, moneda } from "@/lib/formato";
import { METODOS } from "@/lib/estados";
import { ChipFactura } from "@/components/ui/Chip";
import { Imprimir } from "./imprimir";

export const metadata = { title: "Factura" };

export default async function Factura({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const s = await getSesion();
  if (!s) redirect("/ingresar");
  const f = await db.factura.findUnique({ where: { numero }, include: { reserva: { include: { cancha: true, usuario: { include: { facturacion: true } } } }, pagos: { where: { estado: "validado" }, orderBy: { fecha: "desc" } } } });
  if (!f || (s.k === "u" && f.reserva.usuarioId !== s.sub)) notFound();
  const cfg = await getConfig();
  const r = f.reserva, u = r.usuario, fac = u.facturacion;
  const sello = { pagada: ["Pagada", "var(--exito)"], sin_pagar: ["Pendiente", "var(--alerta)"], vencida: ["Vencida", "var(--gris-700)"], anulada: ["Anulada", "var(--error)"] }[f.estado]!;
  const volver = s.k === "u" ? `/portal/reservas/${r.codigo}` : `/tesoreria/facturas/${f.numero}`;
  return (
    <div style={{ background: "var(--gris-50)", minHeight: "100vh", padding: "8px 16px 48px" }}>
      <div className="fila-entre no-imprimir" style={{ maxWidth: 820, margin: "16px auto 0" }}><Link href={volver} className="miga"><ArrowLeft className="i i-sm" />Volver</Link><Imprimir /></div>
      <article className="factura-hoja" aria-label={`Factura ${f.numero}`}>
        <div className="cab">
          <div><img src="/brand/logo-color.png" alt="Universidad de Medellín" /><p className="mini texto-2" style={{ margin: "10px 0 0", lineHeight: 1.6 }}>Universidad de Medellín · NIT {cfg.nitUniversidad}<br />{cfg.contacto.direccion}<br />{cfg.contacto.telefono} · {cfg.contacto.correo}</p></div>
          <div className="num"><span className="mini texto-2">Factura de venta</span><h1>{f.numero}</h1><p className="chico" style={{ margin: "6px 0" }}>Emitida: {fechaLarga(f.creadaEn, true)}<br />Vence: {fechaHora(f.venceEn)}</p><ChipFactura estado={f.estado} /></div>
        </div>
        <span className="sello" style={{ color: sello[1] }}>{sello[0]}</span>
        <div className="grid-2 mt-3" style={{ fontSize: 14 }}>
          <div><b className="mini texto-2" style={{ display: "block", marginBottom: 4 }}>CLIENTE</b><b>{fac?.razonSocial ?? `${u.nombres} ${u.apellidos}`}</b><br />{fac?.tipoPersona === "juridica" ? "NIT" : "C.C."} {fac?.nitCedula ?? u.documento}<br />{fac ? `${fac.direccion}, ${fac.ciudad}` : ""}<br />{u.correo} · {u.celular}</div>
          <div><b className="mini texto-2" style={{ display: "block", marginBottom: 4 }}>RESERVA</b>Código {r.codigo}<br />{r.cancha.nombre}<br />{fechaLarga(r.fecha, true)}, {franja(r.horaInicio, r.horaFin)}</div>
        </div>
        <table>
          <thead><tr><th>Concepto</th><th>Cantidad</th><th style={{ textAlign: "right" }}>Valor unitario</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
          <tbody><tr><td>Alquiler de escenario deportivo: {r.cancha.nombre} ({r.actividad})</td><td>1 hora</td><td style={{ textAlign: "right" }}>{moneda(f.valor)}</td><td style={{ textAlign: "right" }}>{moneda(f.valor)}</td></tr></tbody>
        </table>
        <dl className="dl totales"><dt>Subtotal</dt><dd>{moneda(f.valor)}</dd><dt>IVA</dt><dd>{f.iva ? moneda(f.iva) : "No aplica"}</dd><hr /><dt className="negrita" style={{ color: "var(--tinta)", alignSelf: "center" }}>Total</dt><dd className="total">{moneda(f.total)}</dd></dl>
        {f.pagos[0] && <p className="chico mt-2">Pagado por {METODOS[f.pagos[0].metodo]}{f.pagos[0].referencia ? `, referencia ${f.pagos[0].referencia}` : ""}, validado el {fechaHora(f.pagos[0].validadoEn ?? f.pagos[0].fecha)}.</p>}
        <div className="pie">Documento generado por Reservas Deportivas Universidad de Medellín. Bienestar Universitario, área de Deportes. Vigilada MinEducación.<br />Este documento es un soporte de pago de la plataforma; la factura electrónica oficial la expide la Universidad según la normativa de la DIAN.</div>
      </article>
    </div>
  );
}
