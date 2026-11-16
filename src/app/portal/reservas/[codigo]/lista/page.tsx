import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Check, CreditCard, Upload, FileText, Hourglass, List } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { fechaLarga, franja, moneda, fechaHora } from "@/lib/formato";
import { qrDataUrl } from "@/lib/email";
import { ChipEstado } from "@/components/ui/Chip";
import { CuentaRegresiva } from "@/components/ui/Cliente";
import { Compartir } from "@/components/portal/Compartir";

export const metadata = { title: "Reserva lista" };

export default async function ReservaLista({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const u = await requireUsuario();
  const r = await db.reserva.findUnique({ where: { codigo }, include: { cancha: true, factura: true } });
  if (!r || r.usuarioId !== u.id) notFound();
  const comunidad = !r.factura;
  const datos = <dl className="dl"><dt>Escenario</dt><dd>{r.cancha.nombre}</dd><dt>Fecha</dt><dd>{fechaLarga(r.fecha)}</dd><dt>Hora</dt><dd>{franja(r.horaInicio, r.horaFin)}</dd><dt>Actividad</dt><dd>{r.actividad}, {r.participantes} personas</dd><dt>Código</dt><dd>{r.codigo}</dd><dt>Valor</dt><dd>{r.factura ? moneda(r.factura.total) : "Sin costo"}</dd></dl>;

  if (comunidad) {
    const qr = await qrDataUrl(r.codigo);
    return (
      <div className="contenedor">
        <article className="confirmada">
          <div className="franja-sup"><span className="circ"><Check className="i" strokeWidth={3} /></span><h1>Reserva confirmada</h1><p>Te enviamos el código QR a {u.correo}.</p></div>
          <div className="cuerpo">{datos}<div className="qr"><img src={qr} alt={`Código QR de acceso de la reserva ${r.codigo}`} /><b>{r.codigo}</b><span className="mini texto-2">Muéstralo en la entrada</span></div></div>
          <div className="acciones">
            <a href={`/api/calendario/${r.codigo}`} className="btn btn-primario"><CalendarPlus className="i" />Agregar al calendario</a>
            <Compartir titulo="Reserva de cancha" texto={`Reservé ${r.cancha.nombre} el ${fechaLarga(r.fecha)}, ${franja(r.horaInicio)}.`} />
            <Link href="/portal/reservas" className="btn btn-fantasma"><List className="i" />Ir a Mis reservas</Link>
          </div>
        </article>
      </div>
    );
  }
  const f = r.factura!;
  return (
    <div className="contenedor">
      <article className="confirmada">
        <div className="franja-sup pend"><span className="circ"><Hourglass className="i" /></span><h1>Horario apartado</h1><p>Generamos la factura {f.numero}. Paga antes de que venza el plazo.</p></div>
        <div style={{ padding: "0 32px" }}>
          <div className="contador"><Hourglass className="i i-lg" style={{ color: "var(--alerta)" }} /><div><span>Tu horario queda apartado por</span><br /><CuentaRegresiva hasta={r.limitePago!.toISOString()} compacta /></div><span className="chico" style={{ marginLeft: "auto", textAlign: "right" }}>Vence el<br /><b style={{ fontSize: 15, fontFamily: "var(--f-texto)", color: "#6B4000" }}>{fechaHora(r.limitePago!)}</b></span></div>
        </div>
        <div className="cuerpo" style={{ gridTemplateColumns: "1fr", paddingTop: 24 }}>{datos}<div className="fila"><ChipEstado estado={r.estado} /><span className="chico texto-2">Se confirma cuando Tesorería valide tu pago.</span></div></div>
        <div className="acciones">
          <Link href={`/pago/${f.id}`} className="btn btn-primario btn-lg"><CreditCard className="i" />Pagar en línea</Link>
          <Link href={`/pago/${f.id}/comprobante`} className="btn btn-contorno btn-lg"><Upload className="i" />Subir comprobante</Link>
          <Link href={`/factura/${f.numero}`} className="btn btn-fantasma"><FileText className="i" />Ver factura</Link>
        </div>
      </article>
    </div>
  );
}
