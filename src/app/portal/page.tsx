import Link from "next/link";
import { CalendarPlus, List, Bell, User, Receipt, MapPin, Clock, Users, Hourglass, ChevronRight, CircleCheck, CircleX, Info, Megaphone } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { ahora, fechaLarga, franja, inicioFranja, fechaAIso, isoAFecha, moneda, fechaHora, haceCuanto } from "@/lib/formato";
import { vencerReservas } from "@/lib/disponibilidad";
import { qrDataUrl } from "@/lib/email";
import { Ilustracion } from "@/components/Ilustracion";
import { ChipEstado, BadgeRol } from "@/components/ui/Chip";
import { CuentaRegresiva } from "@/components/ui/Cliente";
import { Vacio } from "@/components/ui/Varios";
import { ICONO_AVISO } from "@/components/portal/avisos";

export const metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";



export default async function InicioPortal() {
  const u = await requireUsuario();
  await vencerReservas();
  const n = ahora();
  const ext = u.tipo === "externo";
  const proximas = await db.reserva.findMany({
    where: { usuarioId: u.id, estado: { in: ["confirmada", "pendiente_pago", "en_validacion", "rechazada"] }, fecha: { gte: isoAFecha(n.iso) } },
    include: { cancha: true, factura: true }, orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  });
  const futuras = proximas.filter((r) => inicioFranja(fechaAIso(r.fecha), r.horaFin).getTime() > Date.now());
  const prox = futuras.find((r) => r.estado === "confirmada") ?? futuras[0];
  const pendientes = ext ? futuras.filter((r) => r.factura && ["pendiente_pago", "rechazada"].includes(r.estado)) : [];
  const avisos = await db.notificacion.findMany({ where: { usuarioId: u.id }, orderBy: { fecha: "desc" }, take: 4 });
  const qr = prox && prox.estado === "confirmada" ? await qrDataUrl(prox.codigo) : null;
  const saludo = n.hora < 12 ? "Buenos días" : n.hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="contenedor">
      <div className="saludo">
        <div><BadgeRol tipo={u.tipo} texto={ext ? "Externo · con pago" : "Comunidad Universidad de Medellín · sin costo"} /><h1>{saludo}, {u.nombres.split(" ")[0]}</h1></div>
        <Link href="/portal/reservar" className="btn btn-primario btn-lg"><CalendarPlus className="i" />Reservar una cancha</Link>
      </div>

      {prox ? (
        <section className="proxima oscuro" aria-labelledby="prox">
          <div className="info">
            <span className="eti">Tu próxima reserva</span>
            <ChipEstado estado={prox.estado} />
            <h2 id="prox">{prox.cancha.nombre}</h2>
            <span className="cuando">{fechaLarga(prox.fecha)}, {franja(prox.horaInicio, prox.horaFin)}</span>
            <div className="fila chico" style={{ color: "#AEB8C2" }}><span className="fila" style={{ gap: 6 }}><Users className="i i-sm" />{prox.participantes} personas</span><span className="fila" style={{ gap: 6 }}><MapPin className="i i-sm" />{prox.cancha.ubicacion}</span></div>
            <CuentaRegresiva hasta={inicioFranja(fechaAIso(prox.fecha), prox.horaInicio).toISOString()} />
            <div className="fila"><Link href={`/portal/reservas/${prox.codigo}`} className="btn btn-destacado">Ver detalle</Link>{prox.estado === "pendiente_pago" && prox.factura && <Link href={`/pago/${prox.factura.id}`} className="btn btn-contorno-claro">Pagar ahora</Link>}</div>
          </div>
          <div className="foto grano"><Ilustracion tipo={prox.cancha.ilustracion} />{qr && <div className="qr-mini"><img src={qr} alt={`Código QR de la reserva ${prox.codigo}`} /></div>}</div>
        </section>
      ) : (
        <Vacio titulo="Aún no tienes reservas próximas" texto={ext ? "Elige un escenario y una hora libre. Tu horario queda apartado 48 horas mientras pagas." : "Elige un escenario y una hora libre. Con tu cuenta de comunidad queda confirmada al instante."} accion={<Link href="/portal/reservar" className="btn btn-primario">Reservar una cancha</Link>} />
      )}

      {pendientes.length > 0 && (
        <section className="mt-4" aria-labelledby="pp">
          <h2 className="t-h3" id="pp" style={{ marginBottom: 12 }}>Pagos pendientes</h2>
          <div className="res-lista">
            {pendientes.map((r) => (
              <div className="pendiente-pago" key={r.id}>
                <span className="kpi" style={{ border: 0, padding: 0, background: "none" }}><span className="ic" style={{ background: "var(--alerta-bg)", color: "var(--alerta)", width: 44, height: 44, borderRadius: 10, display: "grid", placeItems: "center" }}><Hourglass className="i" /></span></span>
                <div><span className="t">{moneda(r.factura!.total)}</span><div className="chico texto-2">{r.cancha.nombre}, {fechaLarga(r.fecha)}, {franja(r.horaInicio)} · Factura {r.factura!.numero}</div>
                  <div className="chico" style={{ color: "#7A4800", fontWeight: 600, marginTop: 4 }}>{r.estado === "rechazada" ? "Pago rechazado: puedes pagar de nuevo" : `Paga antes del ${fechaHora(r.limitePago!)}`}</div></div>
                <div className="fila"><Link className="btn btn-primario" href={`/pago/${r.factura!.id}`}>{r.estado === "rechazada" ? "Pagar de nuevo" : "Pagar en línea"}</Link><Link className="btn btn-contorno" href={`/pago/${r.factura!.id}/comprobante`}>Subir comprobante</Link></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-4" aria-labelledby="acc">
        <h2 className="sr" id="acc">Accesos rápidos</h2>
        <div className="accesos">
          <Link href="/portal/reservar" className="acceso"><span className="ic"><CalendarPlus className="i" /></span><b>Reservar</b><span>Franjas de 1 hora, hasta 14 días</span></Link>
          <Link href="/portal/reservas" className="acceso"><span className="ic"><List className="i" /></span><b>Mis reservas</b><span>{futuras.length} próximas</span></Link>
          {ext ? <Link href="/portal/pagos" className="acceso"><span className="ic"><Receipt className="i" /></span><b>Pagos y facturas</b><span>Descarga tus facturas</span></Link>
            : <Link href="/escenarios" className="acceso"><span className="ic"><MapPin className="i" /></span><b>Escenarios</b><span>Fotos, medidas y servicios</span></Link>}
          <Link href="/portal/perfil" className="acceso"><span className="ic"><User className="i" /></span><b>Mi perfil</b><span>Datos y preferencias</span></Link>
        </div>
      </section>

      <section className="grid-principal mt-4">
        <div className="tarjeta">
          <div className="fila-entre"><h2 className="t-tarjeta">Avisos recientes</h2><Link href="/portal/avisos" className="enlace-simple chico">Ver todos</Link></div>
          {avisos.length ? (
            <div className="lista-avisos">
              {avisos.map((a) => { const [I, bg, c] = ICONO_AVISO[a.tipo] ?? [Bell, "var(--gris-50)", "var(--tinta)"]; return (
                <Link key={a.id} href={a.enlace || "/portal/avisos"} className={a.leida ? "" : "nueva"}><span className="ic" style={{ background: bg, color: c }}><I className="i" /></span><div><b>{a.titulo}</b><span>{a.mensaje}</span></div><small>{haceCuanto(a.fecha)}</small></Link>
              ); })}
            </div>
          ) : <p className="texto-2 chico">No tienes avisos.</p>}
        </div>
        <div className="tarjeta-plana">
          <h2 className="t-tarjeta">Para tener en cuenta</h2>
          <ul className="politicas mt-2">
            <li><Clock className="i" />Llega 10 minutos antes con tu documento y el código QR.</li>
            <li><CircleX className="i" />Si no puedes asistir, cancela desde Mis reservas para liberar la cancha.</li>
            {ext && <li><Hourglass className="i" />Tu horario queda apartado 48 horas mientras pagas.</li>}
          </ul>
          <Link href="/reglamento" className="enlace mt-1">Leer el reglamento<ChevronRight className="i i-sm" /></Link>
        </div>
      </section>
    </div>
  );
}
