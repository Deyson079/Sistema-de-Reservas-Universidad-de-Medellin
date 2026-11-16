import Link from "next/link";
import { Search, Pencil, UserPlus, X } from "lucide-react";
import { db } from "@/lib/db";
import { fechaCorta, fechaHora } from "@/lib/formato";
import { ROLES_PERSONAL, ROLES_USUARIO } from "@/lib/estados";
import { activarPersonal, bloquearUsuario } from "@/lib/acciones-staff";
import { Tabs, Paginacion } from "@/components/ui/Varios";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeRol, ChipEstado } from "@/components/ui/Chip";
import { BotonEnviar } from "@/components/ui/Cliente";
import { FormPersonal } from "./formulario";

export const dynamic = "force-dynamic";

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ tab?: string; editar?: string; q?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "personal";
  const [nPersonal, nUsuarios] = await Promise.all([db.personal.count(), db.usuario.count({ where: { estado: { not: "eliminado" } } })]);
  return (
    <>
      <div className="pag-cab"><div><h1>Usuarios y personal</h1><p>Crea y administra las cuentas de Tesorería y Bienestar. Consulta los usuarios registrados.</p></div>{tab === "personal" && <Link href="/admin/usuarios?editar=nuevo" className="btn btn-primario"><UserPlus className="i" />Nueva cuenta del personal</Link>}</div>
      <Tabs activo={tab} items={[{ id: "personal", texto: "Personal", href: "/admin/usuarios", cuenta: nPersonal }, { id: "usuarios", texto: "Usuarios registrados", href: "/admin/usuarios?tab=usuarios", cuenta: nUsuarios }]} />
      {tab === "personal" ? <Personal editar={sp.editar} /> : <UsuariosReg q={sp.q} pagina={Math.max(1, Number(sp.pagina) || 1)} />}
    </>
  );
}

async function Personal({ editar }: { editar?: string }) {
  const lista = await db.personal.findMany({ orderBy: [{ activo: "desc" }, { rol: "asc" }, { nombre: "asc" }] });
  const sel = editar && editar !== "nuevo" ? lista.find((p) => p.id === editar) : undefined;
  return (
    <div className={editar ? "grid-principal mt-2" : "mt-2"}>
      <div className="tabla-wrap"><table className="t t-resp">
        <thead><tr><th>Persona</th><th>Rol</th><th>Último ingreso</th><th>Estado</th><th /></tr></thead>
        <tbody>{lista.map((p) => (
          <tr key={p.id} style={editar === p.id ? { background: "var(--rojo-50)" } : undefined}>
            <td data-label="Persona" className="full"><div className="persona"><Avatar nombre={p.nombre} tipo="personal" tam="sm" /><div><b style={{ fontWeight: 600 }}>{p.nombre}</b><small>{p.correo}</small></div></div></td>
            <td data-label="Rol"><BadgeRol tipo="personal" texto={ROLES_PERSONAL[p.rol]} /></td>
            <td data-label="Último ingreso">{p.ultimoIngreso ? fechaHora(p.ultimoIngreso) : "Nunca"}</td>
            <td data-label="Estado">{p.activo ? <ChipEstado estado="confirmada" texto="Activa" /> : <ChipEstado estado="cancelada" texto="Desactivada" />}</td>
            <td data-label="" className="full"><div className="fila" style={{ justifyContent: "flex-end" }}>
              <Link className="btn btn-fantasma btn-sm" href={`/admin/usuarios?editar=${p.id}`}><Pencil className="i i-sm" />Editar</Link>
              <form action={activarPersonal}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="activo" value={p.activo ? "no" : "si"} /><BotonEnviar className={`btn btn-sm ${p.activo ? "btn-contorno" : "btn-secundario"}`} style={p.activo ? { color: "var(--error)" } : undefined}>{p.activo ? "Desactivar" : "Activar"}</BotonEnviar></form>
            </div></td>
          </tr>
        ))}</tbody>
      </table></div>
      {editar && (
        <aside className="tarjeta">
          <div className="fila-entre" style={{ marginBottom: 12 }}><h2 className="t-h4" style={{ margin: 0 }}>{sel ? "Editar cuenta" : "Nueva cuenta del personal"}</h2><Link href="/admin/usuarios" className="cerrar" aria-label="Cerrar"><X className="i" /></Link></div>
          <FormPersonal p={sel ? { id: sel.id, nombre: sel.nombre, correo: sel.correo, rol: sel.rol } : undefined} />
        </aside>
      )}
    </div>
  );
}

async function UsuariosReg({ q, pagina }: { q?: string; pagina: number }) {
  const where = { estado: { not: "eliminado" as const }, ...(q ? { OR: [{ nombres: { contains: q, mode: "insensitive" as const } }, { correo: { contains: q, mode: "insensitive" as const } }, { documento: { contains: q } }] } : {}) };
  const [total, us] = await Promise.all([db.usuario.count({ where }), db.usuario.findMany({ where, include: { _count: { select: { reservas: true } } }, orderBy: { creadoEn: "desc" }, skip: (pagina - 1) * 20, take: 20 })]);
  return (
    <>
      <form className="barra-filtros" action="/admin/usuarios"><input type="hidden" name="tab" value="usuarios" /><div className="campo" style={{ flex: "1 1 300px", maxWidth: 420 }}><label htmlFor="q">Buscar</label><div className="busqueda"><Search className="i" /><input id="q" name="q" defaultValue={q} className="input" placeholder="Nombre, correo o documento" /></div></div><button className="btn btn-secundario" style={{ height: 44 }}>Buscar</button><span className="resumen-f">{total} usuarios</span></form>
      <div className="tabla-wrap"><table className="t t-resp">
        <thead><tr><th>Usuario</th><th>Tipo</th><th>Documento</th><th>Registro</th><th className="num">Reservas</th><th>Estado</th><th /></tr></thead>
        <tbody>{us.map((u) => (
          <tr key={u.id}>
            <td data-label="Usuario" className="full"><div className="persona"><Avatar nombre={`${u.nombres} ${u.apellidos}`} tipo={u.tipo} tam="sm" /><div><b style={{ fontWeight: 600 }}>{u.nombres} {u.apellidos}</b><small>{u.correo}{!u.correoVerificado && " · sin verificar"}</small></div></div></td>
            <td data-label="Tipo"><BadgeRol tipo={u.tipo} texto={u.tipo === "comunidad" ? ROLES_USUARIO[u.rol] : "Externo"} /></td>
            <td data-label="Documento">{u.tipoDocumento} {u.documento}</td>
            <td data-label="Registro">{fechaCorta(u.creadoEn)}</td>
            <td className="num" data-label="Reservas">{u._count.reservas}</td>
            <td data-label="Estado">{u.estado === "activo" ? <ChipEstado estado="confirmada" texto="Activo" /> : <ChipEstado estado="rechazada" texto="Bloqueado" />}</td>
            <td data-label="" className="full"><form action={bloquearUsuario} style={{ display: "flex", justifyContent: "flex-end" }}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="estado" value={u.estado === "activo" ? "bloqueado" : "activo"} /><BotonEnviar className="btn btn-fantasma btn-sm">{u.estado === "activo" ? "Bloquear" : "Desbloquear"}</BotonEnviar></form></td>
          </tr>
        ))}</tbody>
      </table></div>
      <Paginacion pagina={pagina} total={total} porPagina={20} base={`/admin/usuarios?tab=usuarios${q ? `&q=${q}` : ""}`} etiqueta="usuarios" />
    </>
  );
}
