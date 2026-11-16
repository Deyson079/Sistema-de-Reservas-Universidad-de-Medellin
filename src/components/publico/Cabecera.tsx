"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronRight, Lock, LayoutDashboard } from "lucide-react";

const NAV = [["/escenarios", "Escenarios"], ["/#como-funciona", "Cómo funciona"], ["/#tarifas", "Tarifas"], ["/ayuda", "Ayuda"], ["/reglamento", "Reglamento"]] as const;

export function Cabecera({ portal }: { portal?: { href: string; nombre: string } | null }) {
  const [fijo, setFijo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  useEffect(() => { const f = () => setFijo(scrollY > 8); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  useEffect(() => { document.body.style.overflow = abierto ? "hidden" : ""; }, [abierto]);
  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className={`cab ${fijo ? "is-stuck" : ""}`}>
        <div className="wrap">
          <Link className="logo" href="/" aria-label="Universidad de Medellín, ir al inicio"><img src="/brand/logo-color.png" alt="Universidad de Medellín, Ciencia y Libertad" /></Link>
          <nav aria-label="Principal">{NAV.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}</nav>
          <div className="acciones">
            {portal ? <Link className="btn btn-primario" href={portal.href}><LayoutDashboard className="i" />Ir a mi portal</Link> : <><Link className="btn btn-contorno" href="/ingresar">Ingresar</Link><Link className="btn btn-primario" href="/registro">Crear cuenta</Link></>}
          </div>
          <button className="hamb" onClick={() => setAbierto(!abierto)} aria-label={abierto ? "Cerrar menú" : "Abrir menú"} aria-expanded={abierto} aria-controls="menu-movil">{abierto ? <X className="i i-lg" /> : <Menu className="i i-lg" />}</button>
        </div>
      </header>
      <nav className={`menu-movil sobre-rojo ${abierto ? "abierto" : ""}`} id="menu-movil" aria-label="Menú" aria-hidden={!abierto}>
        {NAV.map(([h, t]) => <Link key={h} href={h} onClick={() => setAbierto(false)}>{t}<ChevronRight className="i" /></Link>)}
        <div className="btns">
          {portal ? <Link className="btn btn-destacado btn-lg" href={portal.href}>Ir a mi portal</Link> : <><Link className="btn btn-destacado btn-lg" href="/registro">Crear cuenta</Link><Link className="btn btn-contorno-claro btn-lg" href="/ingresar">Ingresar</Link></>}
        </div>
        <Link className="personal-m" href="/personal"><Lock className="i i-sm" />Acceso del personal</Link>
      </nav>
    </>
  );
}
