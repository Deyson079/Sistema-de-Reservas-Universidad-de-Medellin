import { Search, Fingerprint } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fechaHora, isoAFecha, sumarDias } from "@/lib/formato";
import { Paginacion, Vacio } from "@/components/ui/Varios";

export const dynamic = "force-dynamic";

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string; accion?: string; desde?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const where: Prisma.AuditoriaWhereInput = {
    ...(sp.rol ? { actorRol: sp.rol } : {}), ...(sp.accion ? { accion: sp.accion } : {}),
    ...(sp.desde ? { fecha: { gte: new Date(isoAFecha(sp.desde).getTime() + 5 * 3600_000) } } : {}),
    ...(sp.q ? { OR: [{ actor: { contains: sp.q, mode: "insensitive" } }, { detalle: { contains: sp.q, mode: "insensitive" } }, { entidadId: sp.q }] } : {}),
  };
  const [total, filas, acciones] = await Promise.all([db.auditoria.count({ where }), db.auditoria.findMany({ where, orderBy: { fecha: "desc" }, skip: (pagina - 1) * 30, take: 30 }), db.auditoria.findMany({ distinct: ["accion"], select: { accion: true }, orderBy: { accion: "asc" } })]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "pagina") as [string, string][]).toString();
  return (
    <>
      <div className="pag-cab"><div><h1>Registro de auditoría</h1><p>Cada acción importante del sistema: quién, qué y cuándo.</p></div></div>
      <form className="barra-filtros" action="/admin/auditoria">
        <div className="campo" style={{ flex: "2 1 240px" }}><label htmlFor="q">Buscar</label><div className="busqueda"><Search className="i" /><input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Correo, detalle o identificador" /></div></div>
        <div className="campo"><label htmlFor="rol">Rol</label><select id="rol" name="rol" defaultValue={sp.rol ?? ""} className="input"><option value="">Todos</option><option value="comunidad">Comunidad</option><option value="externo">Externo</option><option value="tesoreria">Tesorería</option><option value="bienestar">Bienestar</option><option value="administrador">Administrador</option></select></div>
        <div className="campo"><label htmlFor="accion">Acción</label><select id="accion" name="accion" defaultValue={sp.accion ?? ""} className="input"><option value="">Todas</option>{acciones.map((a) => <option key={a.accion} value={a.accion}>{a.accion.replace(/_/g, " ")}</option>)}</select></div>
        <div className="campo" style={{ minWidth: 150 }}><label htmlFor="desde">Desde</label><input id="desde" name="desde" type="date" defaultValue={sp.desde ?? sumarDias(new Date().toISOString().slice(0, 10), -30)} className="input" /></div>
        <button className="btn btn-secundario" style={{ height: 44 }}>Filtrar</button>
        <span className="resumen-f">{total} registros</span>
      </form>
      {filas.length ? (
        <div className="tabla-wrap"><table className="t t-resp">
          <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
          <tbody>{filas.map((f) => <tr key={f.id}><td data-label="Fecha" style={{ whiteSpace: "nowrap" }}>{fechaHora(f.fecha)}</td><td data-label="Actor"><span className="fila" style={{ gap: 6 }}><Fingerprint className="i i-sm" style={{ color: "var(--gris-500)" }} />{f.actor}</span><small className="nota">{f.actorRol}</small></td><td data-label="Acción"><code>{f.accion}</code></td><td data-label="Entidad">{f.entidad}{f.entidadId && <><br /><small className="nota">{f.entidadId.slice(0, 12)}</small></>}</td><td data-label="Detalle" className="full">{f.detalle ?? "—"}</td></tr>)}</tbody>
        </table></div>
      ) : <Vacio titulo="Sin registros" texto="No hay acciones con esos filtros." />}
      <Paginacion pagina={pagina} total={total} porPagina={30} base={`/admin/auditoria${qs ? `?${qs}` : ""}`} etiqueta="registros" />
    </>
  );
}
