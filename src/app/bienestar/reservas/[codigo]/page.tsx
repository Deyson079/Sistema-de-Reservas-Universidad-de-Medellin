import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCheck, UserX, Ban, Mail, Phone, IdCard, Info, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { fechaLarga, franja, fechaHora, moneda, inicioFranja, fechaAIso } from "@/lib/formato";
import { METODOS, ROLES_USUARIO } from "@/lib/estados";
import { cancelarPorBienestar, marcarAsistencia } from "@/lib/acciones-staff";
import { ChipEstado, BadgeRol, ChipFactura } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { Timeline, pasosReserva } from "@/components/ui/Timeline";
import { Confirmar, CerrarDialogo, BotonEnviar } from "@/components/ui/Cliente";

export const dynamic = "force-dynamic";

export default async function DetalleBienestar({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const r = await db.reserva.findUnique({ where: { codigo }, include: { usuario: { include: { facturacion: true } }, cancha: true, factura: { include: { pagos: { include: { validadoPor: true }, orderBy: { fecha: "desc" } } } } } });
  if (!r) notFound();
  const u = r.usuario;
  const inicio = inicioFranja(fechaAIso(r.fecha), r.horaInicio);
  const puedeAsistencia = ["confirmada", "asistio", "no_asistio"].includes(r.estado) && inicio.getTime() - Date.now() <= 30 * 60_000;
  const cancelable = ["confirmada", "pendiente_pago", "en_validacion"].includes(r.estado) && inicio.getTime() > Date.now();
  const historialUsuario = await db.reserva.groupBy({ by: ["estado"], where: { usuarioId: u.id }, _count: true });
  const h = Object.fromEntries(historialUsuario.map((x) => [x.estado, x._count]));
  return (
    <>
      <Link href="/bienestar/reservas" className="miga mt-2"><ArrowLeft className="i i-sm" />Reservas</Link>
      <div className="pag-cab" style={{ marginTop: 4 }}><div><ChipEstado estado={r.estado} /><h1 style={{ marginTop: 10 }}>{r.codigo}</h1><p>{r.cancha.nombre} · {fechaLarga(r.fecha)}, {franja(r.horaInicio, r.horaFin)}</p></div>
        <div className="acciones">
          {puedeAsistencia && <>
            <form action={marcarAsistencia}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="asistio" value="si" /><BotonEnviar className={`btn ${r.estado === "asistio" ? "btn-secundario" : "btn-contorno"}`} style={r.estado === "asistio" ? undefined : { color: "var(--petroleo-700)" }}><UserCheck className="i" />Asistió</BotonEnviar></form>
            <form action={marcarAsistencia}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="asistio" value="no" /><BotonEnviar className={`btn ${r.estado === "no_asistio" ? "btn-peligro" : "btn-contorno"}`} style={r.estado === "no_asistio" ? undefined : { color: "var(--error)" }}><UserX className="i" />No asistió</BotonEnviar></form>
          </>}
          {cancelable && (
            <Confirmar boton={<><Ban className="i" />Cancelar reserva</>} titulo="¿Cancelar esta reserva?" descripcion={`${u.nombres} recibirá un correo y un aviso con el motivo.`} icono={<Ban className="i" />}>
              <form action={cancelarPorBienestar}><input type="hidden" name="id" value={r.id} />
                <div className="cuerpo">
                  <div className="campo"><label htmlFor="motivo">Motivo</label><select id="motivo" name="motivo" className="input" required><option value="">Elige un motivo</option><option>Evento institucional</option><option>Mantenimiento del escenario</option><option>Condiciones climáticas</option><option>Incumplimiento del reglamento</option><option>Solicitud del usuario</option></select></div>
                  <div className="campo mt-2"><label htmlFor="detalle">Detalle para el usuario</label><textarea id="detalle" name="detalle" className="input" placeholder="Ej.: Juegos Interfacultades. Puedes reservar otra franja sin costo." /></div>
                  {r.factura?.estado === "pagada" && <div className="aviso aviso--alerta mt-2"><Info className="i" /><span>El usuario ya pagó {moneda(r.factura.total)}. Coordina la devolución con Tesorería.</span></div>}
                </div>
                <div className="acciones"><CerrarDialogo>Volver</CerrarDialogo><BotonEnviar className="btn btn-peligro">Cancelar y avisar</BotonEnviar></div>
              </form>
            </Confirmar>
          )}
        </div>
      </div>
      {!puedeAsistencia && r.estado === "confirmada" && <div className="aviso aviso--info" style={{ marginBottom: 16 }}><Info className="i" /><span>La asistencia se puede marcar desde 30 minutos antes del inicio de la franja ({fechaHora(inicio)}).</span></div>}
      <div className="grid-principal">
        <div style={{ display: "grid", gap: 16 }}>
          <section className="tarjeta"><h2 className="t-tarjeta">Reserva</h2>
            <dl className="dl mt-2"><dt>Escenario</dt><dd>{r.cancha.nombre}</dd><dt>Fecha</dt><dd>{fechaLarga(r.fecha, true)}</dd><dt>Franja</dt><dd>{franja(r.horaInicio, r.horaFin)}</dd><dt>Actividad</dt><dd>{r.actividad}</dd><dt>Participantes</dt><dd>{r.participantes} de {r.cancha.capacidad}</dd>{r.observaciones && <><dt>Observaciones</dt><dd style={{ fontWeight: 400 }}>{r.observaciones}</dd></>}<dt>Creada</dt><dd>{fechaHora(r.creadaEn)}</dd>{r.motivoCancelacion && <><dt>Cancelada por</dt><dd>{r.canceladaPor}: {r.motivoCancelacion}</dd></>}</dl>
          </section>
          <section className="tarjeta"><h2 className="t-tarjeta" style={{ marginBottom: 16 }}>Estado</h2><Timeline pasos={pasosReserva(r, !r.factura, (r.factura?.pagos ?? []).map((p) => ({ ...p, metodo: METODOS[p.metodo]! })))} /></section>
        </div>
        <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="tarjeta">
            <div className="persona"><Avatar nombre={`${u.nombres} ${u.apellidos}`} tipo={u.tipo} /><div><b>{u.nombres} {u.apellidos}</b><small>{ROLES_USUARIO[u.rol]}{u.programa ? ` · ${u.programa}` : ""}</small></div></div>
            <div className="mt-2"><BadgeRol tipo={u.tipo} /></div>
            <dl className="dl mt-2" style={{ fontSize: 14 }}><dt><span className="fila" style={{ gap: 6 }}><IdCard className="i i-sm" />Documento</span></dt><dd>{u.tipoDocumento} {u.documento}</dd><dt><span className="fila" style={{ gap: 6 }}><Mail className="i i-sm" />Correo</span></dt><dd style={{ wordBreak: "break-all" }}><a href={`mailto:${u.correo}`} className="enlace-simple">{u.correo}</a></dd><dt><span className="fila" style={{ gap: 6 }}><Phone className="i i-sm" />Celular</span></dt><dd><a href={`tel:${u.celular}`} className="enlace-simple">{u.celular}</a></dd></dl>
            <div className="tarjeta-plana mt-2" style={{ padding: 14 }}><b className="chico">Historial del usuario</b><div className="fila mt-1 chico"><span>{h.asistio ?? 0} asistió</span>·<span style={{ color: (h.no_asistio ?? 0) > 2 ? "var(--error)" : undefined }}>{h.no_asistio ?? 0} no asistió</span>·<span>{h.cancelada ?? 0} canceladas</span></div></div>
          </div>
          {r.factura && <div className="tarjeta"><div className="fila-entre"><h2 className="t-tarjeta"><Receipt className="i i-sm" style={{ display: "inline", verticalAlign: -2 }} /> {r.factura.numero}</h2><ChipFactura estado={r.factura.estado} /></div><p className="t-h3" style={{ margin: "8px 0 0" }}>{moneda(r.factura.total)}</p></div>}
        </aside>
      </div>
    </>
  );
}
