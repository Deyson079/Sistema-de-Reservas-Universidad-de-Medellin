import Link from "next/link";
import { CalendarCheck, Gauge, Wallet, Users, Ban, UserCheck, Download } from "lucide-react";
import { db } from "@/lib/db";
import { moneda } from "@/lib/formato";
import { estadisticas, filtrosDesde } from "@/lib/estadisticas";
import { vencerReservasPeriodico } from "@/lib/disponibilidad";
import { Kpi } from "@/components/ui/Varios";
import { FiltrosPanel } from "@/components/staff/FiltrosPanel";
import { Barras, MapaCalor, BarrasH, Division, TablaDatos } from "@/components/graficas/Graficas";

export const dynamic = "force-dynamic";
const COLOR_ESTADO: Record<string, string> = { confirmada: "#1F7A4D", asistio: "#2B445F", no_asistio: "#B3261E", cancelada: "#7A848D", pendiente_pago: "#B26A00", en_validacion: "#2B5F8A", vencida: "#A8B0B7", rechazada: "#E06C66" };

export default async function InicioBienestar({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await vencerReservasPeriodico();
  const f = filtrosDesde(await searchParams);
  const [e, canchas] = await Promise.all([estadisticas(f), db.cancha.findMany({ orderBy: { orden: "asc" } })]);
  const qs = new URLSearchParams({ desde: f.desde, hasta: f.hasta, ...(f.cancha ? { cancha: f.cancha } : {}), ...(f.tipoUsuario ? { tipoUsuario: f.tipoUsuario } : {}) });
  return (
    <>
      <div className="pag-cab"><div><h1>Bienestar · Deportes</h1><p>Uso de los escenarios, demanda y asistencia.</p></div><a className="btn btn-fantasma" href={`/api/exportar?tipo=reservas&formato=xls&${qs}`}><Download className="i" />Exportar este periodo</a></div>
      <FiltrosPanel accion="/bienestar" f={f} canchas={canchas} />
      <div className="kpis kpis-5">
        <Kpi titulo="Reservas" valor={e.activas} icono={<CalendarCheck className="i" />} detalle={`${e.total} incluyendo canceladas`} />
        <Kpi titulo="Ocupación" valor={<>{e.ocupacion}<small>%</small></>} icono={<Gauge className="i" />} tono="petroleo" detalle="De las franjas disponibles" />
        <Kpi titulo="Ingresos validados" valor={moneda(e.ingresos, false)} icono={<Wallet className="i" />} tono="exito" detalle="Pagos de externos" />
        <Kpi titulo="Participantes" valor={e.participantes.toLocaleString("es-CO")} icono={<Users className="i" />} tono="info" detalle="Declarados al reservar" />
        <Kpi titulo="Cancelaciones" valor={e.cancelaciones} icono={<Ban className="i" />} tono="error" detalle={e.total ? `${Math.round((e.cancelaciones / e.total) * 100)} % del total` : "—"} />
        <Kpi titulo="Asistencia" valor={<>{e.asistencia}<small>%</small></>} icono={<UserCheck className="i" />} tono="exito" detalle="De las reservas ya jugadas" />
      </div>
      <div className="graficas mt-2">
        <div className="graf"><h4>Reservas por día</h4><p className="nota">Reservas activas por fecha. Los días sin servicio aparecen en gris.</p><Barras datos={e.porDia.map((d) => ({ ...d, tip: `${d.valor} reservas` }))} /><TablaDatos titulo="Reservas por día" columnas={["Día", "Reservas"]} filas={e.porDia.map((d) => [d.etiqueta, d.valor])} /></div>
        <div className="graf"><h4>Demanda por hora y día</h4><p className="nota">Porcentaje de franjas ocupadas en el periodo.</p><MapaCalor {...e.calor} /></div>
      </div>
      <div className="grid-3 mt-2">
        <div className="graf"><h4>Uso por cancha</h4><p className="nota">Reservas activas.</p><BarrasH items={e.porCancha} /></div>
        <div className="graf"><h4>Por estado</h4><p className="nota">Todas las reservas del periodo.</p><BarrasH items={e.porEstado.map((x) => ({ ...x, color: COLOR_ESTADO[x.clave] }))} /></div>
        <div className="graf"><h4>Comunidad frente a externos</h4><p className="nota">Reservas activas por tipo de usuario.</p><Division a={{ etiqueta: "Comunidad Universidad de Medellín", valor: e.tipo.comunidad, color: "var(--graf-comunidad)" }} b={{ etiqueta: "Externos", valor: e.tipo.externo, color: "var(--graf-externo)" }} />
          <h4 style={{ marginTop: 24 }}>Por deporte o actividad</h4><div className="mt-1"><BarrasH items={e.porActividad} color="var(--petroleo-700)" /></div></div>
      </div>
      <p className="mt-3 chico texto-2">¿Necesitas el detalle? <Link href="/bienestar/reportes" className="enlace-simple">Descarga reportes en CSV, Excel o PDF</Link>.</p>
    </>
  );
}
