import Link from "next/link";
import { Users, Ruler, Circle } from "lucide-react";
import { resumenHoy } from "@/lib/disponibilidad";
import { hora, moneda, fechaLarga } from "@/lib/formato";
import { Ilustracion } from "@/components/Ilustracion";
import { ChipEstado } from "@/components/ui/Chip";
import { LineasCancha } from "@/components/ui/Varios";

export const metadata = { title: "Escenarios" };
export const dynamic = "force-dynamic";

export default async function Escenarios() {
  const res = await resumenHoy();
  return (
    <>
      <section className="cab-interna sobre-rojo"><LineasCancha /><div className="wrap"><h1>Escenarios</h1><p>{res.filas.length} canchas polideportivas en el campus de la Universidad de Medellín. Disponibilidad de hoy, {fechaLarga(res.hoy.iso)}.</p></div></section>
      <div className="wrap" style={{ padding: "48px 0 96px" }}>
        <div className="lista-esc">
          {res.filas.map(({ cancha: c, libres, franjas, bloqueo }) => {
            const off = c.estado === "fuera_de_servicio" || (!!bloqueo && libres === 0);
            const prox = franjas.find((f) => f.estado === "libre");
            return (
              <article key={c.id} className={`esc ${off ? "esc--off" : ""}`}>
                <div className="foto grano luz" style={{ height: 240 }}>{off ? <ChipEstado estado="fuera_de_servicio" /> : prox ? <span className="chip chip--libre"><Circle className="i" />Próxima libre: {hora(prox.hora)}</span> : <ChipEstado estado="vencida" texto="Sin cupo hoy" />}<Ilustracion tipo={c.ilustracion} /></div>
                <div className="cuerpo">
                  <h3>{c.nombre}</h3>
                  <div className="deps">{c.deportes.map((d) => <span key={d}>{d}</span>)}</div>
                  <p className="chico texto-2" style={{ margin: "0 0 14px" }}>{c.descripcion}</p>
                  <div className="datos"><span><Users className="i" />Hasta {c.capacidad} personas</span><span><Ruler className="i" />{c.dimensiones}</span><span>Externos: <b style={{ color: "var(--tinta)" }}>&nbsp;{moneda(c.tarifaHora)}</b>/hora</span></div>
                  <div className="pie"><span className="libres"><b>{off ? "–" : libres}</b>libres hoy</span><Link className="btn btn-secundario btn-sm" href={`/escenarios/${c.slug}`}>Ver escenario</Link></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
