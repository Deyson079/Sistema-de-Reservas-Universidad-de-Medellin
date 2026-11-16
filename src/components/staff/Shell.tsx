import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Personal } from "@prisma/client";
import { salir } from "@/lib/acciones-auth";
import { iniciales, fechaLarga, ahora } from "@/lib/formato";
import { ROLES_PERSONAL } from "@/lib/estados";
import { SidebarStaff, type ItemNav } from "./Sidebar";

export function StaffShell({ p, rol, items, children }: { p: Personal; rol: "tesoreria" | "bienestar" | "administrador"; items: ItemNav[]; children: React.ReactNode }) {
  const titulo = rol === "tesoreria" ? "Panel de Tesorería" : rol === "bienestar" ? "Panel de Bienestar Universitario · Deportes" : "Administración";
  const otros = p.rol === "administrador" ? [["/tesoreria", "Tesorería"], ["/bienestar", "Bienestar"], ["/admin", "Administración"]].filter(([h]) => !h.includes(rol === "administrador" ? "admin" : rol)) : [];
  return (
    <div className="staff">
      <SidebarStaff items={items} rol={rol} nombre={p.nombre} rolTexto={ROLES_PERSONAL[p.rol]!} salir={salir} iniciales={iniciales(p.nombre)} />
      <div className="staff-main">
        <header className="staff-top">
          <span className="titulo" style={{ paddingLeft: 40 }}>{titulo}</span>
          <div className="der">
            {otros.map(([h, t]) => <Link key={h} href={h} className="btn btn-fantasma btn-sm">{t}</Link>)}
            <span className="chico texto-2" style={{ whiteSpace: "nowrap" }}>{fechaLarga(ahora().iso)}</span>
            <Link href="/" className="btn btn-fantasma btn-sm" target="_blank"><ExternalLink className="i i-sm" />Sitio público</Link>
          </div>
        </header>
        <main id="contenido">{children}</main>
      </div>
    </div>
  );
}
