import { FileSpreadsheet, FileText, Download, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { filtrosDesde } from "@/lib/estadisticas";
import { FiltrosPanel } from "@/components/staff/FiltrosPanel";

export const dynamic = "force-dynamic";

export default async function Reportes({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const f = filtrosDesde(await searchParams);
  const canchas = await db.cancha.findMany({ orderBy: { orden: "asc" } });
  const qs = new URLSearchParams({ desde: f.desde, hasta: f.hasta, ...(f.cancha ? { cancha: f.cancha } : {}), ...(f.tipoUsuario ? { tipoUsuario: f.tipoUsuario } : {}) }).toString();
  const qsP = new URLSearchParams({ periodo: "personalizado", desde: f.desde, hasta: f.hasta, ...(f.cancha ? { cancha: f.cancha } : {}), ...(f.tipoUsuario ? { tipo: f.tipoUsuario } : {}) }).toString();
  const total = await db.reserva.count({ where: { fecha: { gte: new Date(f.desde + "T00:00:00Z"), lte: new Date(f.hasta + "T00:00:00Z") }, ...(f.cancha ? { cancha: { slug: f.cancha } } : {}), ...(f.tipoUsuario ? { usuario: { tipo: f.tipoUsuario as never } } : {}) } });
  const Op = ({ icono, titulo, desc, href, texto, prim }: { icono: React.ReactNode; titulo: string; desc: string; href: string; texto: string; prim?: boolean }) => (
    <div className="tarjeta" style={{ display: "flex", flexDirection: "column", gap: 10 }}><span className="ic" style={{ width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--rojo-50)", color: "var(--rojo-600)" }}>{icono}</span><h2 className="t-h4" style={{ margin: 0 }}>{titulo}</h2><p className="chico texto-2" style={{ margin: 0, flex: 1 }}>{desc}</p><a href={href} className={`btn ${prim ? "btn-primario" : "btn-secundario"}`} target={texto.includes("PDF") ? "_blank" : undefined}><Download className="i" />{texto}</a></div>
  );
  return (
    <>
      <div className="pag-cab"><div><h1>Reportes</h1><p>Exporta las reservas del periodo con los filtros que elijas. {total} reservas en el rango.</p></div></div>
      <FiltrosPanel accion="/bienestar/reportes" f={f} canchas={canchas} />
      <div className="grid-3">
        <Op icono={<FileText className="i" />} titulo="CSV" desc="Texto separado por punto y coma. Para cargar en otros sistemas o en Power BI." href={`/api/exportar?tipo=reservas&formato=csv&${qs}`} texto="Descargar CSV" />
        <Op icono={<FileSpreadsheet className="i" />} titulo="Excel" desc="Hoja de cálculo con encabezados, lista para filtrar y hacer tablas dinámicas." href={`/api/exportar?tipo=reservas&formato=xls&${qs}`} texto="Descargar Excel" prim />
        <Op icono={<Printer className="i" />} titulo="PDF" desc="Informe con indicadores y gráficas para presentar. Se abre listo para imprimir o guardar como PDF." href={`/bienestar/reportes/imprimir?${qsP}`} texto="Generar PDF" />
      </div>
    </>
  );
}
