import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Receipt, Pencil, TriangleAlert } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { franjasDelDia } from "@/lib/disponibilidad";
import { Stepper } from "@/components/ui/Varios";
import { Seleccion, Area } from "@/components/ui/Campo";
import { ResumenReserva } from "@/components/portal/ResumenReserva";

export const metadata = { title: "Datos de la reserva" };

export default async function Datos({ searchParams }: { searchParams: Promise<{ cancha?: string; fecha?: string; hora?: string; actividad?: string; participantes?: string; observaciones?: string }> }) {
  const sp = await searchParams;
  const u = await requireUsuario();
  const cfg = await getConfig();
  const cancha = await db.cancha.findUnique({ where: { slug: sp.cancha ?? "" } });
  const hora = Number(sp.hora);
  if (!cancha || !sp.fecha || Number.isNaN(hora)) redirect("/portal/reservar");
  const f = (await franjasDelDia(cancha.id, sp.fecha, u.id)).find((x) => x.hora === hora);
  if (!f || f.estado !== "libre") redirect(`/portal/reservar?cancha=${cancha.slug}&fecha=${sp.fecha}&err=${encodeURIComponent("Esa franja ya no está libre. Elige otra.")}`);
  const ext = u.tipo === "externo";
  const fac = u.facturacion;
  return (
    <>
      <div className="reservar-cab"><div className="contenedor">
        <Link href={`/portal/reservar?cancha=${cancha.slug}&fecha=${sp.fecha}&hora=${hora}`} className="miga mt-2"><ArrowLeft className="i i-sm" />Cambiar franja</Link>
        <div className="pag-cab" style={{ margin: "4px 0 0" }}><div><h1>Datos de la reserva</h1><p>Cuéntanos qué vas a jugar y cuántas personas asisten.</p></div></div>
        <Stepper paso={2} pasos={["Elige cancha y franja", "Datos de la reserva", "Confirmar"]} />
      </div></div>
      <div className="contenedor grid-principal mt-4">
        <form action="/portal/reservar/confirmar" method="get" className="tarjeta form">
          <input type="hidden" name="cancha" value={cancha.slug} /><input type="hidden" name="fecha" value={sp.fecha} /><input type="hidden" name="hora" value={hora} />
          <h2 className="t-h4" style={{ margin: 0 }}>Actividad</h2>
          <div className="form-grid">
            <Seleccion etiqueta="Actividad o deporte" name="actividad" defaultValue={sp.actividad ?? cancha.deportes[0]} required>{[...cancha.deportes, "Entrenamiento", "Clase o evento académico"].map((d) => <option key={d}>{d}</option>)}</Seleccion>
            <div className="campo"><label htmlFor="participantes">Número de participantes</label><input id="participantes" name="participantes" type="number" min={1} max={cancha.capacidad} defaultValue={sp.participantes ?? Math.min(10, cancha.capacidad)} className="input" required aria-describedby="part-a" /><span className="campo-ayuda" id="part-a">Máximo {cancha.capacidad} personas en este escenario.</span></div>
            <Area etiqueta="Observaciones" name="observaciones" opcional full maxLength={500} defaultValue={sp.observaciones} placeholder="Ej.: necesitamos balones o tableros de baloncesto bajos." ayuda="Máximo 500 caracteres." />
          </div>
          {ext && (
            <>
              <h2 className="t-h4" style={{ margin: "8px 0 0" }} id="facturacion">Datos de facturación</h2>
              {fac ? (
                <div className="tarjeta-plana">
                  <div className="fila-entre"><span className="fila"><Receipt className="i" /><b>{fac.razonSocial}</b></span><Link href="/portal/perfil#facturacion" className="btn btn-fantasma btn-sm"><Pencil className="i i-sm" />Editar</Link></div>
                  <dl className="dl mt-2" style={{ fontSize: 14 }}><dt>{fac.tipoPersona === "juridica" ? "NIT" : "Cédula"}</dt><dd>{fac.nitCedula}</dd><dt>Dirección</dt><dd>{fac.direccion}, {fac.ciudad}</dd><dt>Correo de la factura</dt><dd>{u.correo}</dd><dt>RUT</dt><dd>{fac.rutUrl ? "Cargado" : <span style={{ color: "var(--alerta)" }}>Pendiente</span>}</dd></dl>
                  {!fac.rutUrl && <div className="aviso aviso--alerta mt-2"><TriangleAlert className="i" /><span>Puedes reservar ahora, pero antes de pagar debes subir tu RUT en PDF.</span></div>}
                </div>
              ) : <div className="aviso aviso--alerta"><TriangleAlert className="i" /><span>Completa tus datos de facturación en <Link href="/portal/perfil#facturacion" className="enlace-simple">Mi perfil</Link> antes de reservar.</span></div>}
            </>
          )}
          <div className="fila-entre mt-1"><Link href={`/portal/reservar?cancha=${cancha.slug}&fecha=${sp.fecha}&hora=${hora}`} className="btn btn-fantasma"><ArrowLeft className="i" />Atrás</Link><button className="btn btn-primario btn-lg" type="submit">Revisar y confirmar<ArrowRight className="i" /></button></div>
        </form>
        <ResumenReserva cancha={cancha} fecha={sp.fecha} hora={hora} externo={ext} iva={cfg.ivaPorcentaje} />
      </div>
    </>
  );
}
