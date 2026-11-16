import { estadisticas, filtrosDesde } from "@/lib/estadisticas";
import { fechaLarga, moneda, fechaHora } from "@/lib/formato";
import { db } from "@/lib/db";
import { Barras, BarrasH, Division } from "@/components/graficas/Graficas";
import { Imprimir } from "@/app/factura/[numero]/imprimir";

export const dynamic = "force-dynamic";

export default async function InformePdf({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const f = filtrosDesde(await searchParams);
  const e = await estadisticas(f);
  const cancha = f.cancha ? await db.cancha.findUnique({ where: { slug: f.cancha } }) : null;
  return (
    <div style={{ background: "var(--gris-50)", padding: "0 0 40px" }}>
      <div className="fila-entre no-imprimir" style={{ maxWidth: 820, margin: "0 auto", padding: "16px 0" }}><span className="chico texto-2">Vista de impresión</span><Imprimir /></div>
      <article className="factura-hoja">
        <div className="cab"><img src="/brand/logo-color.png" alt="Universidad de Medellín" /><div className="num"><span className="mini texto-2">Bienestar Universitario · Deportes</span><h1>Informe de uso</h1><p className="chico" style={{ margin: "6px 0 0" }}>Del {fechaLarga(f.desde, true)} al {fechaLarga(f.hasta, true)}<br />{cancha ? cancha.nombre : "Todos los escenarios"} · {f.tipoUsuario ? (f.tipoUsuario === "comunidad" ? "Comunidad" : "Externos") : "Todos los usuarios"}</p></div></div>
        <div className="kpis mt-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {[["Reservas", e.activas], ["Ocupación", `${e.ocupacion} %`], ["Ingresos validados", moneda(e.ingresos, false)], ["Participantes", e.participantes.toLocaleString("es-CO")], ["Cancelaciones", e.cancelaciones], ["Asistencia", `${e.asistencia} %`]].map(([t, v]) => <div key={String(t)} className="kpi" style={{ padding: 14 }}><div className="top" style={{ fontSize: 13 }}>{t}</div><div className="v" style={{ fontSize: 34, margin: "6px 0 0" }}>{v}</div></div>)}
        </div>
        <h3 className="mt-3">Reservas por día</h3><Barras datos={e.porDia.map((d) => ({ ...d, tip: `${d.valor} reservas` }))} />
        <div className="grid-2 mt-3"><div><h3>Uso por cancha</h3><BarrasH items={e.porCancha} /></div><div><h3>Por deporte o actividad</h3><BarrasH items={e.porActividad} color="var(--petroleo-700)" /></div></div>
        <h3 className="mt-3">Comunidad frente a externos</h3><Division a={{ etiqueta: "Comunidad Universidad de Medellín", valor: e.tipo.comunidad, color: "var(--graf-comunidad)" }} b={{ etiqueta: "Externos", valor: e.tipo.externo, color: "var(--graf-externo)" }} />
        <div className="pie">Generado el {fechaHora(new Date())} por Reservas Deportivas Universidad de Medellín. Vigilada MinEducación.</div>
      </article>
    </div>
  );
}
