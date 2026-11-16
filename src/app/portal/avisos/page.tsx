import { Bell, CheckCheck } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { haceCuanto } from "@/lib/formato";
import { marcarLeidas, abrirAviso } from "@/lib/acciones-portal";
import { Tabs, Vacio } from "@/components/ui/Varios";
import { ICONO_AVISO } from "@/components/portal/avisos";

export const metadata = { title: "Avisos" };
export const dynamic = "force-dynamic";

export default async function Avisos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = "todos" } = await searchParams;
  const u = await requireUsuario();
  const [todos, sinLeer] = await Promise.all([db.notificacion.count({ where: { usuarioId: u.id } }), db.notificacion.count({ where: { usuarioId: u.id, leida: false } })]);
  const lista = await db.notificacion.findMany({ where: { usuarioId: u.id, ...(ver === "sin_leer" ? { leida: false } : {}) }, orderBy: { fecha: "desc" }, take: 60 });
  return (
    <div className="contenedor" style={{ maxWidth: 820 }}>
      <div className="pag-cab"><div><h1>Avisos</h1><p>Pagos, confirmaciones, recordatorios y cambios en tus reservas.</p></div>{sinLeer > 0 && <form action={marcarLeidas}><button className="btn btn-fantasma"><CheckCheck className="i" />Marcar todo como leído</button></form>}</div>
      <Tabs activo={ver} items={[{ id: "todos", texto: "Todos", href: "/portal/avisos", cuenta: todos }, { id: "sin_leer", texto: "Sin leer", href: "/portal/avisos?ver=sin_leer", cuenta: sinLeer, alerta: true }]} />
      {lista.length ? (
        <div className="tarjeta mt-2" style={{ padding: "4px 20px" }}>
          <div className="lista-avisos">
            {lista.map((a) => { const [I, bg, c] = ICONO_AVISO[a.tipo] ?? [Bell, "var(--gris-50)", "var(--tinta)"]; return (
              <form key={a.id} action={abrirAviso} style={{ display: "contents" }}><input type="hidden" name="id" value={a.id} />
                <button type="submit" className={`it ${a.leida ? "" : "nueva"}`} style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 12, alignItems: "start", padding: "14px 4px", border: 0, borderBottom: "1px solid var(--borde)", background: "none", textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <span className="ic" style={{ background: bg, color: c }}><I className="i" /></span><div><b>{a.titulo}</b><span>{a.mensaje}</span></div><small>{haceCuanto(a.fecha)}</small>
                </button>
              </form>
            ); })}
          </div>
        </div>
      ) : <div className="mt-3"><Vacio titulo={ver === "sin_leer" ? "Estás al día" : "Sin avisos todavía"} texto="Aquí te contamos cuando recibamos tu pago, se confirme una reserva o haya cambios en un escenario." /></div>}
    </div>
  );
}
