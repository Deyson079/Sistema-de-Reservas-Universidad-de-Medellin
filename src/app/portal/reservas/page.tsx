import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { ahora, isoAFecha } from "@/lib/formato";
import { vencerReservasPeriodico } from "@/lib/disponibilidad";
import { Tabs, Vacio, Paginacion } from "@/components/ui/Varios";
import { TarjetaReserva } from "@/components/portal/TarjetaReserva";

export const metadata = { title: "Mis reservas" };
export const dynamic = "force-dynamic";

export default async function MisReservas({ searchParams }: { searchParams: Promise<{ tab?: string; cancha?: string; q?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const u = await requireUsuario();
  await vencerReservasPeriodico();
  const hoy = isoAFecha(ahora().iso);
  const tab = sp.tab ?? "proximas";
  const base: Prisma.ReservaWhereInput = { usuarioId: u.id, ...(sp.cancha ? { cancha: { slug: sp.cancha } } : {}), ...(sp.q ? { codigo: { contains: sp.q.toUpperCase() } } : {}) };
  const filtros: Record<string, Prisma.ReservaWhereInput> = {
    proximas: { estado: { in: ["confirmada", "en_validacion"] }, fecha: { gte: hoy } },
    pendientes: { estado: { in: ["pendiente_pago", "rechazada"] } },
    historial: { OR: [{ estado: { in: ["asistio", "no_asistio", "vencida"] } }, { estado: "confirmada", fecha: { lt: hoy } }] },
    canceladas: { estado: "cancelada" },
  };
  const cuentas = await Promise.all(Object.values(filtros).map((w) => db.reserva.count({ where: { ...base, ...w } })));
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const where = { ...base, ...filtros[tab] };
  const [total, reservas, canchas] = await Promise.all([
    db.reserva.count({ where }),
    db.reserva.findMany({ where, include: { cancha: true, factura: true }, orderBy: [{ fecha: tab === "proximas" || tab === "pendientes" ? "asc" : "desc" }, { horaInicio: "asc" }], skip: (pagina - 1) * 10, take: 10 }),
    db.cancha.findMany({ orderBy: { orden: "asc" } }),
  ]);
  const q = (t: string) => `/portal/reservas?tab=${t}${sp.cancha ? `&cancha=${sp.cancha}` : ""}${sp.q ? `&q=${sp.q}` : ""}`;
  const items = [
    { id: "proximas", texto: "Próximas", href: q("proximas"), cuenta: cuentas[0] },
    ...(u.tipo === "externo" ? [{ id: "pendientes", texto: "Pendientes de pago", href: q("pendientes"), cuenta: cuentas[1], alerta: true }] : []),
    { id: "historial", texto: "Historial", href: q("historial"), cuenta: cuentas[2] },
    { id: "canceladas", texto: "Canceladas", href: q("canceladas"), cuenta: cuentas[3] },
  ];
  return (
    <div className="contenedor">
      <div className="pag-cab"><div><h1>Mis reservas</h1><p>Tus reservas próximas, pendientes y pasadas.</p></div><Link href="/portal/reservar" className="btn btn-primario">Nueva reserva</Link></div>
      <div className="filtros-fijos">
        <Tabs items={items} activo={tab} />
        <form className="fila mt-2" action="/portal/reservas">
          <input type="hidden" name="tab" value={tab} />
          <select name="cancha" defaultValue={sp.cancha ?? ""} className="input" style={{ width: 240 }} aria-label="Filtrar por escenario"><option value="">Todos los escenarios</option>{canchas.map((c) => <option key={c.id} value={c.slug}>{c.nombre}</option>)}</select>
          <div className="busqueda" style={{ flex: "1 1 200px", maxWidth: 280 }}><Search className="i" /><input name="q" defaultValue={sp.q} className="input" placeholder="Buscar por código" aria-label="Buscar por código" /></div>
          <button className="btn btn-secundario">Filtrar</button>
          {(sp.cancha || sp.q) && <Link className="btn btn-fantasma" href={`/portal/reservas?tab=${tab}`}>Limpiar</Link>}
        </form>
      </div>
      {reservas.length ? (
        <><div className="res-lista">{reservas.map((r) => <TarjetaReserva key={r.id} r={r} />)}</div><Paginacion pagina={pagina} total={total} porPagina={10} base={q(tab)} etiqueta="reservas" /></>
      ) : (
        <Vacio titulo={tab === "proximas" ? "No tienes reservas próximas" : tab === "pendientes" ? "No tienes pagos pendientes" : tab === "canceladas" ? "No has cancelado reservas" : "Aún no hay historial"} texto={tab === "proximas" ? "Elige un escenario y una hora libre para jugar." : "Aquí verás tus reservas cuando las tengas."} accion={tab === "proximas" ? <Link href="/portal/reservar" className="btn btn-primario">Reservar una cancha</Link> : undefined} />
      )}
    </div>
  );
}
