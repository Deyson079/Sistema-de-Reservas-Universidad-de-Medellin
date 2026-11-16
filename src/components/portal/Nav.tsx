"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarPlus, List, Bell, User, Plus, Receipt } from "lucide-react";

export function NavPortal({ externo }: { externo: boolean }) {
  const p = usePathname();
  const act = (h: string) => (h === "/portal" ? p === h : p.startsWith(h)) ? "page" : undefined;
  return (
    <nav className="p-nav" aria-label="Portal">
      <Link href="/portal" aria-current={act("/portal")}><House className="i" />Inicio</Link>
      <Link href="/portal/reservar" aria-current={act("/portal/reservar")}><CalendarPlus className="i" />Reservar</Link>
      <Link href="/portal/reservas" aria-current={act("/portal/reservas")}><List className="i" />Mis reservas</Link>
      {externo && <Link href="/portal/pagos" aria-current={act("/portal/pagos")}><Receipt className="i" />Pagos y facturas</Link>}
    </nav>
  );
}

export function BarraInferior({ avisos }: { avisos: number }) {
  const p = usePathname();
  const act = (h: string) => (h === "/portal" ? p === h : p.startsWith(h)) ? "page" : undefined;
  return (
    <nav className="bottom-bar" aria-label="Navegación principal">
      <Link href="/portal" aria-current={act("/portal")}><House className="i" />Inicio</Link>
      <Link href="/portal/reservas" aria-current={act("/portal/reservas")}><List className="i" />Mis reservas</Link>
      <Link href="/portal/reservar" className="reservar" aria-current={act("/portal/reservar")}><span className="fab"><Plus className="i i-lg" /></span>Reservar</Link>
      <Link href="/portal/avisos" aria-current={act("/portal/avisos")}><Bell className="i" />{avisos > 0 && <span className="punto">{avisos}</span>}Avisos</Link>
      <Link href="/portal/perfil" aria-current={act("/portal/perfil")}><User className="i" />Perfil</Link>
    </nav>
  );
}
