import Link from "next/link";
import { Bell, User, Receipt, LogOut, List } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { salir } from "@/lib/acciones-auth";
import { NavPortal, BarraInferior } from "@/components/portal/Nav";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeRol } from "@/components/ui/Chip";
import { ROLES_USUARIO } from "@/lib/estados";

export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const u = await requireUsuario();
  const avisos = await db.notificacion.count({ where: { usuarioId: u.id, leida: false } });
  const ext = u.tipo === "externo";
  return (
    <div className="portal">
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="p-cab">
        <div className="contenedor">
          <Link href="/portal" className="logo" aria-label="Inicio del portal"><img src="/brand/logo-color.png" alt="Universidad de Medellín" /></Link>
          <NavPortal externo={ext} />
          <div className="p-der">
            <Link href="/portal/avisos" className="campana" aria-label={`Avisos${avisos ? `, ${avisos} sin leer` : ""}`}><Bell className="i" />{avisos > 0 && <span className="n">{avisos}</span>}</Link>
            <details className="menu-usuario">
              <summary aria-label="Menú de la cuenta"><Avatar nombre={`${u.nombres} ${u.apellidos}`} tipo={u.tipo} /><span className="quien">{u.nombres.split(" ")[0]}<small>{ext ? "Externo" : ROLES_USUARIO[u.rol]}</small></span></summary>
              <div className="caja">
                <div style={{ padding: "8px 12px 10px" }}><b style={{ display: "block", fontSize: 14 }}>{u.nombres} {u.apellidos}</b><span className="mini texto-2">{u.correo}</span><div className="mt-1"><BadgeRol tipo={u.tipo} texto={ext ? "Externo" : "Comunidad"} /></div></div>
                <hr />
                <Link href="/portal/perfil"><User className="i" />Mi perfil</Link>
                <Link href="/portal/reservas"><List className="i" />Mis reservas</Link>
                {ext && <Link href="/portal/pagos"><Receipt className="i" />Pagos y facturas</Link>}
                <hr />
                <form action={salir}><button type="submit"><LogOut className="i" />Cerrar sesión</button></form>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main id="contenido">{children}</main>
      <BarraInferior avisos={avisos} />
    </div>
  );
}
