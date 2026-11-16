import Link from "next/link";
import { Search, Download } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { fechaCorta, franja, isoAFecha, ahora } from "@/lib/formato";
import { ESTADOS } from "@/lib/estados";
import { ChipEstado, BadgeRol } from "@/components/ui/Chip";
import { Paginacion, Vacio } from "@/components/ui/Varios";

export const dynamic = "force-dynamic";

export default async function ListaReservas({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; cancha?: string; tipo?: string; fecha?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const where: Prisma.ReservaWhereInput = {
    ...(sp.estado ? { estado: sp.estado as never } : {}),
    ...(sp.cancha ? { cancha: { slug: sp.cancha } } : {}),
    ...(sp.tipo ? { usuario: { tipo: sp.tipo as never } } : {}),
    ...(sp.fecha ? { fecha: isoAFecha(sp.fecha) } : {}),
    ...(sp.q ? { OR: [{ codigo: { contains: sp.q.toUpperCase() } }, { usuario: { nombres: { contains: sp.q, mode: "insensitive" } } }, { usuario: { apellidos: { contains: sp.q, mode: "insensitive" } } }, { usuario: { correo: { contains: sp.q, mode: "insensitive" } } }, { usuario: { documento: { contains: sp.q } } }] } : {}),
  };
  const [total, reservas, canchas] = await Promise.all([
    db.reserva.count({ where }),
    db.reserva.findMany({ where, include: { usuario: true, cancha: true }, orderBy: [{ fecha: sp.fecha || sp.q ? "asc" : "desc" }, { horaInicio: "asc" }], skip: (pagina - 1) * 20, take: 20 }),
    db.cancha.findMany({ orderBy: { orden: "asc" } }),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "pagina") as [string, string][]).toString();
  return (
    <>
      <div className="pag-cab"><div><h1>Reservas</h1><p>Busca una reserva para ver al solicitante, marcar asistencia o cancelarla.</p></div><a className="btn btn-fantasma" href={`/api/exportar?tipo=reservas&formato=csv`}><Download className="i" />Exportar</a></div>
      <form className="barra-filtros" action="/bienestar/reservas">
        <div className="campo" style={{ flex: "2 1 240px" }}><label htmlFor="q">Buscar</label><div className="busqueda"><Search className="i" /><input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Código, nombre, correo o documento" /></div></div>
        <div className="campo" style={{ minWidth: 150 }}><label htmlFor="fecha">Fecha</label><input id="fecha" name="fecha" type="date" defaultValue={sp.fecha} className="input" /></div>
        <div className="campo"><label htmlFor="estado">Estado</label><select id="estado" name="estado" defaultValue={sp.estado ?? ""} className="input"><option value="">Todos</option>{Object.entries(ESTADOS).filter(([k]) => !["libre", "fuera_de_servicio"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="campo"><label htmlFor="cancha">Cancha</label><select id="cancha" name="cancha" defaultValue={sp.cancha ?? ""} className="input"><option value="">Todas</option>{canchas.map((c) => <option key={c.id} value={c.slug}>{c.nombre}</option>)}</select></div>
        <div className="campo"><label htmlFor="tipo">Usuario</label><select id="tipo" name="tipo" defaultValue={sp.tipo ?? ""} className="input"><option value="">Todos</option><option value="comunidad">Comunidad</option><option value="externo">Externos</option></select></div>
        <button className="btn btn-secundario" style={{ height: 44 }}>Buscar</button>
        <Link href={`/bienestar/reservas?fecha=${ahora().iso}`} className="btn btn-fantasma" style={{ height: 44 }}>Hoy</Link>
        <span className="resumen-f">{total} reservas</span>
      </form>
      {reservas.length ? (
        <div className="tabla-wrap"><table className="t t-resp">
          <thead><tr><th>Código</th><th>Solicitante</th><th>Escenario</th><th>Fecha y hora</th><th>Actividad</th><th>Estado</th><th /></tr></thead>
          <tbody>{reservas.map((r) => (
            <tr key={r.id}>
              <td className="cod" data-label="Código">{r.codigo}</td>
              <td data-label="Solicitante"><b style={{ fontWeight: 600 }}>{r.usuario.nombres} {r.usuario.apellidos}</b><br /><BadgeRol tipo={r.usuario.tipo} texto={r.usuario.tipo === "comunidad" ? "Comunidad" : "Externo"} /></td>
              <td data-label="Escenario">{r.cancha.nombre}</td>
              <td data-label="Fecha">{fechaCorta(r.fecha)}<br /><small className="nota">{franja(r.horaInicio, r.horaFin)}</small></td>
              <td data-label="Actividad">{r.actividad}<br /><small className="nota">{r.participantes} personas</small></td>
              <td data-label="Estado"><ChipEstado estado={r.estado} /></td>
              <td data-label="" className="full"><Link className="btn btn-fantasma btn-sm" href={`/bienestar/reservas/${r.codigo}`}>Detalle</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <Vacio titulo="Sin resultados" texto="No encontramos reservas con esos filtros." />}
      <Paginacion pagina={pagina} total={total} porPagina={20} base={`/bienestar/reservas${qs ? `?${qs}` : ""}`} etiqueta="reservas" />
    </>
  );
}
