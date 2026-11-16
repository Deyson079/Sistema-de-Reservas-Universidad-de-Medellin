import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Ban, CreditCard, Upload, FileText, Info, MapPin, Users, Clock } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { fechaLarga, franja, moneda, fechaHora, inicioFranja, fechaAIso } from "@/lib/formato";
import { qrDataUrl } from "@/lib/email";
import { cancelarMiReserva } from "@/lib/acciones-portal";
import { METODOS } from "@/lib/estados";
import { ChipEstado, ChipFactura } from "@/components/ui/Chip";
import { Confirmar, CerrarDialogo, BotonEnviar } from "@/components/ui/Cliente";
import { Timeline, pasosReserva } from "@/components/ui/Timeline";
import { Ilustracion } from "@/components/Ilustracion";
import { Compartir } from "@/components/portal/Compartir";

export const metadata = { title: "Detalle de reserva" };
export const dynamic = "force-dynamic";

export default async function DetalleReserva({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const u = await requireUsuario();
  const cfg = await getConfig();
  const r = await db.reserva.findUnique({ where: { codigo }, include: { cancha: true, factura: { include: { pagos: { include: { validadoPor: true }, orderBy: { fecha: "desc" } } } } } });
  if (!r || r.usuarioId !== u.id) notFound();
  const inicio = inicioFranja(fechaAIso(r.fecha), r.horaInicio);
  const cancelable = ["confirmada", "pendiente_pago", "en_validacion"].includes(r.estado) && inicio.getTime() > Date.now();
  const sinPenalidad = inicio.getTime() - Date.now() > cfg.horasCancelacion * 3600_000;
  const qr = ["confirmada", "asistio"].includes(r.estado) ? await qrDataUrl(r.codigo) : null;
  const pagos = (r.factura?.pagos ?? []).map((p) => ({ ...p, metodo: METODOS[p.metodo] ?? p.metodo }));
  const f = r.factura;
  const pagarDeNuevo = f && r.estado === "rechazada" ? <Link href={`/pago/${f.id}`} className="btn btn-primario btn-sm mt-1">Pagar de nuevo</Link> : null;
  return (
    <div className="contenedor">
      <Link href="/portal/reservas" className="miga mt-2"><ArrowLeft className="i i-sm" />Mis reservas</Link>
      <div className="pag-cab" style={{ marginTop: 4 }}>
        <div><ChipEstado estado={r.estado} /><h1 style={{ marginTop: 10 }}>{r.cancha.nombre}</h1><p>{fechaLarga(r.fecha)}, {franja(r.horaInicio, r.horaFin)} · Código {r.codigo}</p></div>
        <div className="acciones">
          {["confirmada", "en_validacion", "pendiente_pago"].includes(r.estado) && <a className="btn btn-contorno" href={`/api/calendario/${r.codigo}`}><CalendarPlus className="i" />Agregar al calendario</a>}
          {qr && <Compartir titulo="Reserva de cancha" texto={`Reservé ${r.cancha.nombre} el ${fechaLarga(r.fecha)}, ${franja(r.horaInicio)}.`} className="btn btn-fantasma" />}
        </div>
      </div>
      <div className="grid-principal">
        <div style={{ display: "grid", gap: 16 }}>
          {r.estado === "pendiente_pago" && f && (
            <div className="aviso aviso--alerta"><Info className="i" /><span><b>Paga antes del {fechaHora(r.limitePago!)}</b>Si no recibimos el pago a tiempo, la reserva vence y la franja se libera.</span></div>
          )}
          <section className="tarjeta" aria-labelledby="t-est"><h2 className="t-tarjeta" id="t-est" style={{ marginBottom: 18 }}>Estado de la reserva</h2><Timeline pasos={pasosReserva(r, !f, pagos, pagarDeNuevo)} /></section>
          <section className="tarjeta" aria-labelledby="t-dat">
            <h2 className="t-tarjeta" id="t-dat">Datos</h2>
            <dl className="dl mt-2"><dt><span className="fila" style={{ gap: 6 }}><Clock className="i i-sm" />Franja</span></dt><dd>{franja(r.horaInicio, r.horaFin)}</dd><dt>Actividad</dt><dd>{r.actividad}</dd><dt><span className="fila" style={{ gap: 6 }}><Users className="i i-sm" />Participantes</span></dt><dd>{r.participantes}</dd><dt><span className="fila" style={{ gap: 6 }}><MapPin className="i i-sm" />Ubicación</span></dt><dd style={{ fontWeight: 400 }}>{r.cancha.ubicacion}</dd>{r.observaciones && <><dt>Observaciones</dt><dd style={{ fontWeight: 400 }}>{r.observaciones}</dd></>}{r.motivoCancelacion && <><dt>Motivo de cancelación</dt><dd style={{ fontWeight: 400 }}>{r.motivoCancelacion}</dd></>}</dl>
          </section>
          {f && (
            <section className="tarjeta" aria-labelledby="t-fac">
              <div className="fila-entre"><h2 className="t-tarjeta" id="t-fac">Factura {f.numero}</h2><ChipFactura estado={f.estado} /></div>
              <dl className="dl mt-2"><dt>Valor</dt><dd>{moneda(f.valor)}</dd>{f.iva > 0 && <><dt>IVA</dt><dd>{moneda(f.iva)}</dd></>}<dt>Total</dt><dd className="total">{moneda(f.total)}</dd></dl>
              <div className="fila mt-2">
                <Link href={`/factura/${f.numero}`} className="btn btn-fantasma"><FileText className="i" />Ver y descargar factura</Link>
                {f.estado === "sin_pagar" && ["pendiente_pago", "rechazada"].includes(r.estado) && <><Link href={`/pago/${f.id}`} className="btn btn-primario"><CreditCard className="i" />{r.estado === "rechazada" ? "Pagar de nuevo" : "Pagar en línea"}</Link><Link href={`/pago/${f.id}/comprobante`} className="btn btn-contorno"><Upload className="i" />Subir comprobante</Link></>}
              </div>
            </section>
          )}
        </div>
        <aside style={{ display: "grid", gap: 16 }}>
          <div className="tarjeta" style={{ textAlign: "center" }}>
            {qr ? <><img src={qr} alt={`Código QR de acceso de la reserva ${r.codigo}`} style={{ width: 220, height: 220, margin: "0 auto", border: "1px solid var(--borde)", borderRadius: 12, padding: 8 }} /><b className="t-h3" style={{ display: "block", marginTop: 10, letterSpacing: ".06em" }}>{r.codigo}</b><p className="chico texto-2" style={{ margin: "4px 0 0" }}>Muestra este código y tu documento en la entrada.</p></>
              : <><div style={{ position: "relative", height: 160, borderRadius: 12, overflow: "hidden", background: "#7A1C20" }} className="grano"><Ilustracion tipo={r.cancha.ilustracion} className="ilus" style={{ position: "absolute", inset: "-40%", transform: "perspective(900px) rotateX(50deg) rotateZ(-24deg)" }} /></div><p className="chico texto-2">{r.estado === "pendiente_pago" || r.estado === "en_validacion" || r.estado === "rechazada" ? "El código QR aparece cuando la reserva queda confirmada." : "Esta reserva ya no tiene código de acceso activo."}</p></>}
          </div>
          {cancelable && (
            <div className="tarjeta-plana">
              <h2 className="t-tarjeta">¿No puedes ir?</h2>
              <p className="chico texto-2">{sinPenalidad ? `Faltan más de ${cfg.horasCancelacion} horas: puedes cancelar sin penalidad.` : `Faltan menos de ${cfg.horasCancelacion} horas. Si cancelas, queda registrado en tu historial.`}</p>
              <Confirmar boton={<><Ban className="i" />Cancelar reserva</>} titulo="¿Cancelar esta reserva?" descripcion={`${r.cancha.nombre}, ${fechaLarga(r.fecha)}, ${franja(r.horaInicio)}`} icono={<Ban className="i" />}>
                <form action={cancelarMiReserva}>
                  <input type="hidden" name="id" value={r.id} />
                  <div className="cuerpo">
                    <div className={`aviso ${sinPenalidad ? "aviso--info" : "aviso--alerta"}`} style={{ marginBottom: 14 }}><Info className="i" /><span>{sinPenalidad ? `Faltan más de ${cfg.horasCancelacion} horas: la franja se libera y no pierdes nada.` : `Faltan menos de ${cfg.horasCancelacion} horas: la cancelación quedará registrada.`}{f && f.estado === "pagada" ? " Tesorería te contactará para la devolución o el cambio de fecha." : ""}</span></div>
                    <div className="campo"><label htmlFor="motivo">Motivo</label><select id="motivo" name="motivo" className="input" required><option>Se cruzó con una clase o compromiso</option><option>El equipo no está completo</option><option>Problemas de salud</option><option>Clima</option><option>Otro motivo</option></select></div>
                  </div>
                  <div className="acciones"><CerrarDialogo>Mantener reserva</CerrarDialogo><BotonEnviar className="btn btn-peligro">Cancelar reserva</BotonEnviar></div>
                </form>
              </Confirmar>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
