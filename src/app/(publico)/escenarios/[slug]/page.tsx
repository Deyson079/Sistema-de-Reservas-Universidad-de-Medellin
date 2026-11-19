import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Ruler, MapPin, CircleCheck, CalendarPlus, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { ahora, fechaLarga, moneda, fechaHora } from "@/lib/formato";
import { cache } from "react";
import { disponibilidad } from "@/lib/disponibilidad";
import { Ilustracion } from "@/components/Ilustracion";
import { ChipEstado, BadgeRol } from "@/components/ui/Chip";
import { CuadriculaFranjas, LeyendaFranjas } from "@/components/portal/Franjas";

export const dynamic = "force-dynamic";

// Metadatos y página comparten la misma consulta en cada petición
const canchaPorSlug = cache((slug: string) =>
  db.cancha.findUnique({ where: { slug }, include: { bloqueos: { where: { hasta: { gte: new Date() } }, orderBy: { desde: "asc" }, take: 3 } } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await canchaPorSlug((await params).slug);
  return { title: c?.nombre ?? "Escenario" };
}

export default async function Escenario({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await canchaPorSlug(slug);
  if (!c) notFound();
  const hoy = ahora().iso;
  const [disp, otras] = await Promise.all([
    disponibilidad([c], [hoy]),
    db.cancha.findMany({ where: { id: { not: c.id } }, orderBy: { orden: "asc" } }),
  ]);
  const franjas = disp.de(c.id, hoy);
  const pos: Record<string, [number, number]> = { "coliseo-cubierto": [180, 110], "cancha-sintetica": [330, 70], "placa-polideportiva-1": [210, 160], "cancha-de-voleibol": [360, 150] };
  const [px, py] = pos[c.slug] ?? [260, 120];
  return (
    <div className="wrap" style={{ padding: "24px 0 96px" }}>
      <Link href="/escenarios" className="miga"><ArrowLeft className="i i-sm" />Todos los escenarios</Link>
      <div className="pag-cab" style={{ marginTop: 4 }}><div>{c.estado === "activa" ? <ChipEstado estado="libre" texto="Disponible para reservar" /> : <ChipEstado estado="fuera_de_servicio" />}<h1 style={{ fontSize: 72, marginTop: 10 }}>{c.nombre}</h1><p>{c.descripcion}</p></div><Link className="btn btn-primario btn-lg" href={`/portal/reservar?cancha=${c.slug}`}><CalendarPlus className="i" />Reservar aquí</Link></div>
      <div className="esc-det">
        <div style={{ display: "grid", gap: 24 }}>
          <div className="galeria" aria-label="Fotos del escenario">{[0, 1, 2].map((i) => <div key={i} className="g grano luz"><Ilustracion tipo={c.ilustracion} /></div>)}</div>
          <section aria-labelledby="disp">
            <div className="fila-entre" style={{ marginBottom: 14 }}><h2 id="disp" className="t-h3" style={{ margin: 0 }}>Disponibilidad de hoy</h2><span className="chico texto-2">{fechaLarga(hoy)}</span></div>
            <LeyendaFranjas />
            <div className="mt-2"><CuadriculaFranjas franjas={franjas} href={(h) => `/portal/reservar?cancha=${c.slug}&fecha=${hoy}&hora=${h}`} /></div>
          </section>
        </div>
        <aside style={{ display: "grid", gap: 16 }}>
          <div className="tarjeta">
            <h2 className="t-h4" style={{ margin: "0 0 12px" }}>Ficha técnica</h2>
            <dl className="dl"><dt><span className="fila" style={{ gap: 6 }}><Users className="i i-sm" />Capacidad</span></dt><dd>{c.capacidad} personas</dd><dt><span className="fila" style={{ gap: 6 }}><Ruler className="i i-sm" />Dimensiones</span></dt><dd>{c.dimensiones}</dd><dt>Deportes</dt><dd>{c.deportes.join(", ")}</dd><hr /><dt>Comunidad</dt><dd><BadgeRol tipo="comunidad" texto="Sin costo" /></dd><dt>Externos</dt><dd className="t-num" style={{ fontSize: 22 }}>{moneda(c.tarifaHora)}/hora</dd></dl>
          </div>
          <div className="tarjeta"><h2 className="t-h4" style={{ margin: "0 0 12px" }}>Servicios</h2><ul className="servicios">{c.servicios.map((s) => <li key={s}><CircleCheck className="i i-sm" />{s}</li>)}</ul></div>
          <div className="tarjeta">
            <h2 className="t-h4" style={{ margin: "0 0 4px" }}>Ubicación en el campus</h2><p className="chico texto-2" style={{ margin: "0 0 12px" }}><MapPin className="i i-sm" style={{ display: "inline", verticalAlign: -3 }} /> {c.ubicacion}</p>
            <div className="mapa-campus" role="img" aria-label={`Plano del campus con la ubicación de ${c.nombre}`}>
              <svg viewBox="0 0 480 220"><rect width="480" height="220" fill="#EEF1F3" /><path d="M0 190 L480 150" stroke="#fff" strokeWidth="18" /><path d="M120 0 L150 220" stroke="#fff" strokeWidth="12" />
                {[[30, 30, 70, 50], [30, 100, 70, 60], [260, 20, 110, 40], [400, 40, 60, 70], [240, 100, 70, 40]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill="#DCE1E5" />)}
                {Object.entries(pos).map(([s, [x, y]]) => <rect key={s} x={x - 22} y={y - 14} width="44" height="28" rx="3" fill={s === c.slug ? "#C2262B" : "#C4CAD0"} />)}
                <circle cx={px} cy={py - 34} r="12" fill="#C2262B" /><path d={`M${px} ${py - 16} l-8 -12 h16z`} fill="#C2262B" /><circle cx={px} cy={py - 34} r="5" fill="#fff" />
                <text x="20" y="208" fontSize="11" fill="#4A5560">Portería principal · Carrera 87</text></svg>
            </div>
          </div>
          {c.bloqueos.length > 0 && <div className="aviso aviso--alerta"><Wrench className="i" /><span><b>Próximos cierres</b>{c.bloqueos.map((b) => <span key={b.id} style={{ display: "block" }}>{b.motivo}: {fechaHora(b.desde)} a {fechaHora(b.hasta)}</span>)}</span></div>}
        </aside>
      </div>
      <h2 className="t-h3 mt-6" style={{ marginBottom: 16 }}>Otros escenarios</h2>
      <div className="grid-3">{otras.map((o) => <Link key={o.id} href={`/escenarios/${o.slug}`} className="cancha-op" style={{ padding: 14 }}><span className="mini-foto" style={{ width: 72, height: 72 }}><Ilustracion tipo={o.ilustracion} className="" style={{ position: "absolute", inset: 0 }} /></span><span><b>{o.nombre}</b><small>{o.deportes.join(", ")}</small></span></Link>)}</div>
    </div>
  );
}
