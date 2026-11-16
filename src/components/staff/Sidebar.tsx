"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { ChartColumn, ShieldCheck, Wallet, Receipt, CalendarDays, List, MapPin, Download, Users, Settings, Fingerprint, Mail } from "lucide-react";
const I = { ChartColumn, ShieldCheck, Wallet, Receipt, CalendarDays, List, MapPin, Download, Users, Settings, Fingerprint, Mail };

export type ItemNav = { href: string; texto: string; icono: keyof typeof I; cuenta?: number };

export function SidebarStaff({ items, rol, nombre, rolTexto, salir, iniciales }: { items: ItemNav[]; rol: string; nombre: string; rolTexto: string; salir: () => Promise<void>; iniciales: string }) {
  const p = usePathname();
  const [abierta, setAbierta] = useState(false);
  const clase = rol === "tesoreria" ? "sb-tes" : rol === "bienestar" ? "sb-bien" : "sb-adm";
  const raiz = items[0]?.href;
  return (
    <>
      <button className="cerrar staff-movil" style={{ position: "fixed", top: 14, left: 10, zIndex: 85 }} onClick={() => setAbierta(!abierta)} aria-label={abierta ? "Cerrar menú" : "Abrir menú"} aria-expanded={abierta}>{abierta ? <X className="i" /> : <Menu className="i" />}</button>
      <aside className={`sidebar ${clase} oscuro ${abierta ? "abierta" : ""}`} aria-label="Menú del personal">
        <div className="marca"><img src="/brand/logo-blanco.png" alt="Universidad de Medellín" /></div>
        <div className="rol"><span className="av av--per anillo av-sm">{iniciales}</span><div><b>{nombre}</b><small>{rolTexto}</small></div></div>
        <nav>
          {items.map((it) => {
            const Ic = I[it.icono] as React.ComponentType<{ className?: string }>;
            const act = it.href === raiz ? p === it.href : p.startsWith(it.href);
            return <Link key={it.href} href={it.href} aria-current={act ? "page" : undefined} onClick={() => setAbierta(false)}><Ic className="i" />{it.texto}{it.cuenta ? <span className="num">{it.cuenta}</span> : null}</Link>;
          })}
        </nav>
        <form action={salir}><button type="submit"><LogOut className="i" />Cerrar sesión</button></form>
      </aside>
    </>
  );
}
