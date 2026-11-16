"use client";
import { useActionState, useRef } from "react";
import Link from "next/link";
import { Mail, CircleX, MailWarning, Lock } from "lucide-react";
import { ingresar, verificarAhora, type Estado } from "@/lib/acciones-auth";
import { BotonEnviar, CampoPassword } from "@/components/ui/Cliente";

const DEMO = [["lmrestrepo@soyudemedellin.edu.co", "Comunidad (estudiante)"], ["contacto@deportesdelvalle.co", "Externo (empresa)"], ["juanpablo.ospina@gmail.com", "Externo (persona natural)"]];

export function FormIngresar({ siguiente, demo }: { siguiente?: string; demo: boolean }) {
  const [e, accion] = useActionState<Estado, FormData>(ingresar, undefined);
  const form = useRef<HTMLFormElement>(null);
  const llenar = (c: string) => { const f = form.current!; (f.elements.namedItem("correo") as HTMLInputElement).value = c; const p = f.elements.namedItem("password") as HTMLInputElement; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!; set.call(p, "Cancha2026*"); p.dispatchEvent(new Event("input", { bubbles: true })); };
  return (
    <>
      <form action={accion} className="form" ref={form}>
        <input type="hidden" name="siguiente" value={siguiente ?? ""} />
        <div aria-live="polite">
          {e?.tipo === "credenciales" && <div className="error-general"><CircleX className="i" /><span>{e.error}</span></div>}
          {e?.tipo === "bloqueada" && <div className="aviso aviso--error"><Lock className="i" /><span><b>Cuenta bloqueada temporalmente</b>{e.error} <Link href="/recuperar" className="enlace-simple">Cambiar contraseña</Link></span></div>}
          {e?.tipo === "sin_verificar" && <div className="aviso aviso--alerta"><MailWarning className="i" /><span><b>Cuenta sin verificar</b>{e.error}</span><button formAction={verificarAhora} className="btn btn-secundario btn-sm acc">Verificar ahora</button></div>}
        </div>
        <div className="campo">
          <label htmlFor="correo">Correo</label>
          <div className="control"><Mail className="i" /><input id="correo" name="correo" type="email" className="input" defaultValue={e?.valores?.correo} autoComplete="username" required style={{ paddingLeft: 42 }} /></div>
        </div>
        <CampoPassword />
        <div className="fila-entre">
          <label className="check" style={{ paddingTop: 0, alignItems: "center" }}><input type="checkbox" name="recordar" />Recordarme</label>
          <Link href="/recuperar" className="enlace-simple chico">¿Olvidaste tu contraseña?</Link>
        </div>
        <BotonEnviar className="btn btn-primario btn-lg ancho">Ingresar</BotonEnviar>
        <p className="chico texto-2 centrado">¿No tienes cuenta? <Link href="/registro" className="enlace-simple">Crea una</Link></p>
      </form>
      {demo && (
        <div className="demo"><b>Cuentas de prueba</b>
          {DEMO.map(([c, t]) => <button key={c} type="button" onClick={() => llenar(c)}>{t}<span>{c}</span></button>)}
          <span className="mini texto-2">Contraseña: Cancha2026*</span>
        </div>
      )}
    </>
  );
}
