"use client";
import { useActionState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CircleX, Mail, ShieldCheck } from "lucide-react";
import { ingresarPersonal, type Estado } from "@/lib/acciones-auth";
import { BotonEnviar, CampoPassword } from "@/components/ui/Cliente";

const DEMO = [["tesoreria@udemedellin.edu.co", "Tesorería"], ["bienestar@udemedellin.edu.co", "Bienestar · Deportes"], ["admin@udemedellin.edu.co", "Administrador"]];

export default function AccesoPersonal() {
  const [e, accion] = useActionState<Estado, FormData>(ingresarPersonal, undefined);
  const sp = useSearchParams();
  const form = useRef<HTMLFormElement>(null);
  const llenar = (c: string) => { const f = form.current!; (f.elements.namedItem("correo") as HTMLInputElement).value = c; const p = f.elements.namedItem("password") as HTMLInputElement; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(p, "Cancha2026*"); p.dispatchEvent(new Event("input", { bubbles: true })); };
  return (
    <div className="staff-card">
      <div className="cab"><img src="/brand/escudo.png" alt="Universidad de Medellín" /><div><h1>Acceso del personal</h1><p>Tesorería, Bienestar Universitario y administradores</p></div></div>
      <form action={accion} className="form" ref={form}>
        {sp.get("error") === "permiso" && <div className="aviso aviso--alerta"><ShieldCheck className="i" /><span>Tu rol no tiene acceso a esa sección.</span></div>}
        {e?.error && <div className="error-general"><CircleX className="i" /><span>{e.error}</span></div>}
        <div className="campo"><label htmlFor="correo">Correo institucional</label><div className="control"><Mail className="i" /><input id="correo" name="correo" type="email" className="input" defaultValue={e?.valores?.correo} autoComplete="username" required style={{ paddingLeft: 42 }} /></div></div>
        <CampoPassword />
        <BotonEnviar className="btn btn-secundario btn-lg ancho">Ingresar</BotonEnviar>
      </form>
      {process.env.NEXT_PUBLIC_MODO_DEMO === "true" && (
        <div className="demo"><b>Cuentas de prueba del personal</b>{DEMO.map(([c, t]) => <button key={c} type="button" onClick={() => llenar(c)}>{t}<span>{c}</span></button>)}<span className="mini texto-2">Contraseña: Cancha2026*</span></div>
      )}
    </div>
  );
}
