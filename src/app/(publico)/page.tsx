import Link from "next/link";
import { MapPin, Clock, CalendarDays, CircleCheck, Landmark, Wallet, ArrowRight, Hourglass, ShieldCheck, Users, Ruler, Building2, Wrench, Receipt, Info, Plus, Mail, Phone, ChevronRight, Circle } from "lucide-react";
import { resumenHoy } from "@/lib/disponibilidad";
import { getConfig } from "@/lib/config";
import { fechaLarga, hora, horaDe, moneda } from "@/lib/formato";
import { qrDataUrl } from "@/lib/email";
import { Ilustracion } from "@/components/Ilustracion";
import { Marcador } from "@/components/publico/Marcador";
import { Balon } from "@/components/publico/Balon";
import { ChipEstado, BadgeRol } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

const FAQ = (cfg: Awaited<ReturnType<typeof getConfig>>) => [
  ["¿Con cuánta anticipación puedo reservar?", `Hasta ${cfg.diasAnticipacion} días antes. Cada franja dura 1 hora y puedes reservar hasta ${cfg.maxFranjasDia} franjas por día.`],
  ["Soy externo, ¿cuándo queda confirmada mi reserva?", `Cuando Tesorería valida tu pago. Mientras tanto, el horario queda apartado ${cfg.horasParaPagar} horas. Si no pagas en ese plazo, la reserva vence y la franja se libera para otros.`],
  ["¿Cómo cancelo una reserva?", `Desde Mis reservas, con un motivo. Si faltan más de ${cfg.horasCancelacion} horas, la franja se libera sin penalidad. Si ya pagaste, Tesorería te contacta para el cambio de fecha o la devolución.`],
  ["¿Qué necesito para entrar al escenario?", "El código QR de tu reserva y tu documento de identidad. Llega 10 minutos antes para registrar la asistencia."],
  ["¿Qué pasa si cierran el escenario el día de mi reserva?", "Si Bienestar Universitario cancela tu reserva por mantenimiento o un evento institucional, te avisamos por correo y en Avisos, y puedes elegir otra franja sin costo."],
];

export default async function Inicio() {
  const [res, cfg] = await Promise.all([resumenHoy(), getConfig()]);
  const qr = await qrDataUrl("RD-24830");
  const canchas = res.filas.map((f) => f.cancha);
  const minTarifa = Math.min(...canchas.map((c) => c.tarifaHora));
  const horas = res.filas[0]?.franjas.map((f) => f.hora) ?? [];
  const proxLibre = (i: number) => res.filas[i]?.franjas.find((f) => f.estado === "libre")?.hora;
  const filas = res.filas.map((f) => ({
    slug: f.cancha.slug, nombre: f.cancha.nombre, deportes: f.cancha.deportes.join(", "), libres: f.libres,
    franjas: f.franjas.map((x) => ({ hora: x.hora, estado: x.estado })),
    fuera: f.cancha.estado === "fuera_de_servicio" || (f.bloqueo && f.libres === 0) ? `${f.bloqueo?.tipo === "evento" ? "Evento institucional" : "Fuera de servicio por mantenimiento"}${f.bloqueo ? ` hasta el ${fechaLarga(new Date(f.bloqueo.hasta.getTime() - 5 * 3600_000))}` : ""}` : undefined,
  }));
  const grande = canchas[0], resto = canchas.slice(1);

  return (
    <>
      {/* HERO */}
      <section className="hero sobre-rojo" aria-labelledby="titular">
        <svg className="lineas" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="2" aria-hidden>
          <line x1="800" y1="0" x2="800" y2="760" /><circle cx="800" cy="380" r="150" /><circle cx="800" cy="380" r="5" fill="#fff" fillOpacity=".14" />
          <rect x="-2" y="170" width="150" height="420" /><rect x="-2" y="270" width="60" height="220" /><path d="M148 300 A90 90 0 0 1 148 460" />
        </svg>
        <div className="wrap">
          <div>
            <h1 id="titular"><span><i>Tu cancha,</i></span><span><i>reservada en</i></span><span><i>tres pasos.</i></span></h1>
            <p className="lead">Reserva por horas las canchas polideportivas de la Universidad de Medellín. Si eres de la comunidad universitaria, juegas sin costo y tu reserva queda confirmada al instante.</p>
            <div className="ctas"><Link className="btn btn-destacado btn-lg" href="/registro">Crear cuenta</Link><Link className="btn btn-contorno-claro btn-lg" href="/ingresar">Ingresar</Link></div>
            <div className="hechos">
              <div><MapPin className="i" /><span><b>{canchas.length} escenarios</b>en el campus</span></div>
              <div><Clock className="i" /><span><b>Franjas de 1 hora</b>de {hora(cfg.horaApertura).replace(/ /g, " ")} a {hora(cfg.horaCierre).replace(/ /g, " ")}</span></div>
              <div><CalendarDays className="i" /><span><b>Hasta {cfg.diasAnticipacion} días</b>de anticipación</span></div>
            </div>
          </div>
          <div className="visual" aria-hidden>
            <div className="foto grano luz"><Ilustracion tipo="baloncesto" /></div>
            <div className="balon"><Balon /></div>
            <div className="ticket">
              <div className="arriba"><div><ChipEstado estado="confirmada" /><h3>Coliseo cubierto</h3><p>martes 17 de noviembre<br />6:00 p.&nbsp;m. – 7:00 p.&nbsp;m.</p></div><span className="badge badge--comunidad" style={{ height: 22, padding: "0 7px" }}><Landmark className="i" />Sin costo</span></div>
              <div className="corte" />
              <div className="abajo"><img className="qr" src={qr} alt="" /><div><small>Código de reserva</small><b>RD-24830</b><small>Muestra el QR en la entrada</small></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* HOY EN LOS ESCENARIOS */}
      <div className="wrap">
        <Marcador filas={filas} total={res.total} fecha={fechaLarga(res.hoy.iso)} actualizado={horaDe(new Date())} horaActual={res.hoy.hora} isoHoy={res.hoy.iso} horas={horas} />
      </div>

      {/* DOS CAMINOS */}
      <section className="sec" aria-labelledby="caminos">
        <div className="wrap">
          <div className="sec-cab"><h2 id="caminos">Dos formas<br />de jugar</h2><p>La plataforma reconoce tu correo al registrarte. Según el dominio, sabes desde el primer momento si pagas o no.</p></div>
          <div className="caminos">
            <article className="camino camino--com">
              <span className="area" aria-hidden />
              <span className="badge badge--comunidad" style={{ background: "rgba(255,255,255,.14)" }}><Landmark className="i" />Estudiantes, docentes, administrativos y egresados</span>
              <h3>Comunidad Universidad de Medellín <span style={{ whiteSpace: "nowrap" }}>· sin costo</span></h3>
              <div className="precio"><b>$0</b><span>por cada<br />franja de 1 hora</span></div>
              <ul className="lista">
                <li><CircleCheck className="i" />Regístrate con tu correo {cfg.dominios.map((d) => "@" + d).join(" o ")}. Lo reconocemos automáticamente.</li>
                <li><CircleCheck className="i" />Tu reserva queda confirmada al instante.</li>
                <li><CircleCheck className="i" />Entras al escenario con el código QR de tu reserva.</li>
              </ul>
              <Link className="btn btn-blanco btn-lg" href="/registro/comunidad" style={{ color: "var(--petroleo-700)" }}>Crear cuenta de comunidad</Link>
            </article>
            <article className="camino camino--ext">
              <span className="area" aria-hidden />
              <span className="badge" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}><Wallet className="i" />Personas naturales y empresas</span>
              <h3>Externos · con pago</h3>
              <div className="precio"><b>{moneda(minTarifa, false)}</b><span>COP por hora,<br />desde</span></div>
              <ul className="lista">
                <li><CircleCheck className="i" />Te registras con cualquier correo y tus datos de facturación.</li>
                <li><CircleCheck className="i" />Pagas en línea con tarjeta, PSE, Nequi o Daviplata, o por transferencia.</li>
                <li><CircleCheck className="i" />Tu horario queda apartado {cfg.horasParaPagar} horas mientras Tesorería valida el pago.</li>
              </ul>
              <Link className="btn btn-blanco btn-lg" href="/registro/externo">Crear cuenta de externo</Link>
            </article>
            <span className="centro" aria-hidden />
            <span className="circulo" aria-hidden><img src="/brand/escudo.png" alt="" /></span>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="sec" id="como-funciona" aria-labelledby="cf">
        <div className="wrap">
          <div className="sec-cab"><h2 id="cf">Cómo funciona</h2><p>Tres jugadas y tienes cancha. Todo desde el celular o el computador.</p></div>
          <div className="tablero">
            <svg className="lineas" viewBox="0 0 1280 520" preserveAspectRatio="none" fill="none" stroke="#16222F" strokeOpacity=".07" strokeWidth="2" aria-hidden><rect x="16" y="16" width="1248" height="488" rx="4" /><line x1="640" y1="16" x2="640" y2="504" /><circle cx="640" cy="260" r="80" /><rect x="16" y="140" width="120" height="240" /><rect x="1144" y="140" width="120" height="240" /></svg>
            <svg className="jugada" viewBox="0 0 1280 520" preserveAspectRatio="none" fill="none" aria-hidden><path d="M150 106 C 300 20, 380 190, 480 106" stroke="#16222F" strokeWidth="2.5" strokeDasharray="8 8" /><path d="M552 106 C 700 20, 790 190, 892 106" stroke="#16222F" strokeWidth="2.5" strokeDasharray="8 8" /></svg>
            <ol className="pasos">
              <li className="paso"><span className="ficha">1</span><div><h3>Elige escenario y hora</h3><p>Mira la disponibilidad de los próximos {cfg.diasAnticipacion} días y toma una franja libre de 1 hora.</p></div></li>
              <li className="paso"><span className="ficha">2</span><div><h3>Completa los datos</h3><p>Cuéntanos qué vas a jugar y cuántas personas asisten. Si eres externo, tus datos de facturación ya están cargados.</p></div></li>
              <li className="paso"><span className="ficha">3</span><div><h3>Recibe tu QR</h3><p>Lo que pasa después depende de tu cuenta:</p>
                <div className="resultado">
                  <div><BadgeRol tipo="comunidad" texto="Comunidad" /><span className="paso-f"><ArrowRight className="i flecha" /><ChipEstado estado="confirmada" /></span></div>
                  <div><BadgeRol tipo="externo" /><span className="paso-f"><ArrowRight className="i flecha" /><ChipEstado estado="pendiente_pago" /></span><span className="paso-f"><ArrowRight className="i flecha" /><ChipEstado estado="en_validacion" /></span><span className="paso-f"><ArrowRight className="i flecha" /><ChipEstado estado="confirmada" /></span></div>
                </div></div></li>
            </ol>
          </div>
        </div>
      </section>

      {/* ESCENARIOS */}
      <section className="sec" id="escenarios" aria-labelledby="esc">
        <div className="wrap">
          <div className="sec-cab"><h2 id="esc">Escenarios</h2><Link className="enlace" href="/escenarios">Ver todos los escenarios<ChevronRight className="i i-sm" /></Link></div>
          <div className="bento">
            {grande && (
              <article className="esc esc--grande">
                <div className="foto grano">{proxLibre(0) !== undefined && <span className="chip chip--libre"><Circle className="i" />Libre a {proxLibre(0) === 13 || proxLibre(0) === 1 ? "la" : "las"} {hora(proxLibre(0)!)}</span>}<Ilustracion tipo={grande.ilustracion} /></div>
                <div className="cuerpo"><h3>{grande.nombre}</h3><div className="deps">{grande.deportes.map((d) => <span key={d}>{d}</span>)}</div>
                  <div className="datos"><span><Users className="i" />Hasta {grande.capacidad} personas</span><span><Ruler className="i" />{grande.dimensiones}</span><span><Building2 className="i" />{grande.servicios.slice(0, 2).join(", ")}</span></div>
                  <div className="pie"><span className="libres"><b>{res.filas[0]!.libres}</b>franjas libres hoy</span><Link className="btn btn-destacado" href={`/escenarios/${grande.slug}`}>Ver escenario</Link></div></div>
              </article>
            )}
            {resto.map((c, i) => {
              const f = res.filas[i + 1]!;
              const off = c.estado === "fuera_de_servicio" || (!!f.bloqueo && f.libres === 0);
              const ult = i === resto.length - 1 && resto.length === 3;
              const pl = proxLibre(i + 1);
              return (
                <article key={c.id} className={`esc ${off ? "esc--off" : ""} ${ult ? "esc--fila" : ""}`}>
                  <div className="foto grano luz">{off ? <ChipEstado estado="fuera_de_servicio" /> : pl !== undefined ? <span className="chip chip--libre"><Circle className="i" />Libre a {pl === 13 ? "la" : "las"} {hora(pl)}</span> : null}<Ilustracion tipo={c.ilustracion} /></div>
                  <div className="cuerpo"><h3>{c.nombre}</h3><div className="deps">{c.deportes.map((d) => <span key={d}>{d}</span>)}</div>
                    <div className="datos"><span><Users className="i" />Hasta {c.capacidad}</span><span><Ruler className="i" />{c.dimensiones}</span></div>
                    {off ? <p className="aviso"><Wrench className="i" /><span>{f.bloqueo?.motivo ?? "En mantenimiento"}.{f.bloqueo && <> Vuelve a estar disponible después del <b>{fechaLarga(new Date(f.bloqueo.hasta.getTime() - 5 * 3600_000))}</b>.</>}</span></p>
                      : <div className="pie"><span className="libres"><b>{f.libres}</b>libres hoy</span><Link className="btn btn-secundario btn-sm" href={`/escenarios/${c.slug}`}>Ver escenario</Link></div>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* TARIFAS */}
      <section className="sec" id="tarifas" aria-labelledby="tar">
        <div className="wrap tarifas">
          <div>
            <div className="sec-cab" style={{ margin: 0 }}><h2 id="tar">Tarifas</h2></div>
            <ul className="notas">
              <li><span className="ic" style={{ background: "var(--petroleo-50)", color: "var(--petroleo-700)" }}><Landmark className="i" /></span><div><b>Comunidad: siempre sin costo</b>Con tu correo institucional no ves precios ni pasarela de pago.</div></li>
              <li><span className="ic"><Hourglass className="i" /></span><div><b>{cfg.horasParaPagar} horas para pagar</b>Si no pagas en ese plazo, la reserva vence y la franja se libera.</div></li>
              <li><span className="ic"><Receipt className="i" /></span><div><b>Factura a tu nombre o con NIT</b>Antes de tu primer pago te pedimos el RUT en PDF.</div></li>
            </ul>
          </div>
          <div className="tabla-precios" role="table" aria-label="Tarifas por hora">
            <div className="tp-fila" role="row"><span role="columnheader">Escenario</span><span role="columnheader">Comunidad</span><span role="columnheader">Externos, por hora</span></div>
            {[...canchas].sort((a, b) => b.tarifaHora - a.tarifaHora).map((c) => (
              <div className="tp-fila" role="row" key={c.id}><span className="esc-n" role="cell">{c.nombre}<small>{c.deportes.join(", ")}</small></span><span className="com" role="cell"><span className="badge badge--comunidad">Sin costo</span></span><span className="v" role="cell">{moneda(c.tarifaHora, false)}<small>COP</small></span></div>
            ))}
            <div className="tp-nota"><Info className="i" />Si tu factura lleva IVA, lo verás desglosado en el resumen antes de pagar.</div>
          </div>
        </div>
      </section>

      {/* PREGUNTAS */}
      <section className="sec" id="ayuda" aria-labelledby="faqt">
        <div className="wrap faq">
          <div>
            <div className="sec-cab" style={{ margin: 0 }}><h2 id="faqt">Preguntas frecuentes</h2></div>
            <div className="ayuda"><b>¿No encuentras tu respuesta?</b><p>Escríbenos y te respondemos en horario de oficina.</p>
              <div className="contacto"><span><Mail className="i i-sm" />{cfg.contacto.correo}</span><span><Phone className="i i-sm" />{cfg.contacto.telefono}</span></div>
              <Link className="enlace" href="/ayuda" style={{ marginTop: 8 }}>Ir a Ayuda y preguntas frecuentes<ChevronRight className="i i-sm" /></Link></div>
          </div>
          <div className="acordeon">
            {FAQ(cfg).map(([p, r], i) => (
              <details key={p} open={i === 0}><summary>{p}<span className="mas"><Plus className="i" /></span></summary><div className="resp">{r}</div></details>
            ))}
          </div>
        </div>
      </section>

      {/* LLAMADO FINAL */}
      <section className="final" aria-labelledby="fin">
        <svg className="lineas" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#16222F" strokeOpacity=".1" strokeWidth="2" aria-hidden><line x1="840" y1="0" x2="840" y2="420" /><circle cx="840" cy="250" r="120" /><rect x="1330" y="110" width="160" height="280" /></svg>
        <div className="wrap"><h2 id="fin">El equipo ya está. Falta la cancha.</h2><div className="ctas"><Link className="btn btn-primario btn-lg" href="/registro">Crear cuenta</Link><Link className="btn btn-contorno-tinta btn-lg" href="/escenarios">Ver escenarios</Link></div></div>
      </section>
    </>
  );
}
