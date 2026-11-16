"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Phone, CircleCheck, TriangleAlert } from "lucide-react";
import { registrarComunidad, type Estado } from "@/lib/acciones-auth";
import { Campo, Seleccion } from "@/components/ui/Campo";
import { BotonEnviar, CampoPassword } from "@/components/ui/Cliente";

export function FormComunidad({ dominios }: { dominios: string[] }) {
  const [e, accion] = useActionState<Estado, FormData>(registrarComunidad, undefined);
  const v = e?.valores ?? {};
  const c = e?.campos ?? {};
  const [correo, setCorreo] = useState(v.correo ?? "");
  const dom = correo.includes("@") ? correo.split("@")[1]!.toLowerCase() : "";
  const ok = dominios.includes(dom);
  return (
    <form action={accion} className="form" noValidate>
      <div className="form-grid">
        <Campo etiqueta="Nombres" name="nombres" defaultValue={v.nombres} error={c.nombres} autoComplete="given-name" required />
        <Campo etiqueta="Apellidos" name="apellidos" defaultValue={v.apellidos} error={c.apellidos} autoComplete="family-name" required />
        <Seleccion etiqueta="Tipo de documento" name="tipoDocumento" defaultValue={v.tipoDocumento ?? "CC"}><option value="CC">Cédula de ciudadanía</option><option value="TI">Tarjeta de identidad</option><option value="CE">Cédula de extranjería</option><option value="PA">Pasaporte</option></Seleccion>
        <Campo etiqueta="Número de documento" name="documento" inputMode="numeric" defaultValue={v.documento} error={c.documento} required />
        <div className="campo full">
          <label htmlFor="correo">Correo institucional</label>
          <div className="control"><Mail className="i" /><input id="correo" name="correo" type="email" className="input" autoComplete="email" value={correo} onChange={(x) => setCorreo(x.target.value)} aria-invalid={!!c.correo} aria-describedby="correo-d" placeholder={`usuario@${dominios[1] ?? dominios[0]}`} required style={{ paddingLeft: 42 }} /></div>
          <div id="correo-d" aria-live="polite">
            {c.correo ? <span className="dominio dominio--no"><TriangleAlert className="i" />{c.correo}</span>
              : dom && dom.includes(".") ? (ok ? <span className="dominio dominio--ok"><CircleCheck className="i" />✓ Correo institucional de la Universidad de Medellín: no pagarás reservas</span>
                : <span className="dominio dominio--no"><TriangleAlert className="i" />Este no es un correo de la Universidad de Medellín. Usa {dominios.map((d) => "@" + d).join(" o ")}, o <Link href="/registro/externo" className="enlace-simple">&nbsp;crea una cuenta de externo</Link>.</span>)
              : <span className="campo-ayuda">Termina en {dominios.map((d) => "@" + d).join(" o ")}.</span>}
          </div>
        </div>
        <Seleccion etiqueta="Rol en la Universidad" name="rol" defaultValue={v.rol ?? ""} error={c.rol}><option value="" disabled>Elige una opción</option><option value="estudiante">Estudiante</option><option value="docente">Docente</option><option value="administrativo">Administrativo</option><option value="egresado">Egresado</option></Seleccion>
        <Campo etiqueta="Programa o dependencia" name="programa" defaultValue={v.programa} error={c.programa} placeholder="Ej.: Ingeniería de Sistemas" required />
        <Campo etiqueta="Celular" name="celular" type="tel" inputMode="numeric" icono={<Phone className="i" />} defaultValue={v.celular} error={c.celular} placeholder="300 000 0000" autoComplete="tel" full required />
        <div className="full"><CampoPassword fortaleza autoComplete="new-password" error={c.password} /></div>
        <div className="full"><CampoPassword name="confirmar" etiqueta="Confirma la contraseña" autoComplete="new-password" error={c.confirmar} /></div>
      </div>
      <label className="check"><input type="checkbox" name="terminos" required /><span>Acepto los <Link href="/terminos" target="_blank">términos y condiciones</Link>, el <Link href="/reglamento" target="_blank">reglamento de uso</Link> y la <Link href="/terminos#datos" target="_blank">política de tratamiento de datos</Link> (Ley 1581 de 2012).</span></label>
      {c.terminos && <span className="campo-ayuda" style={{ color: "var(--error)" }}>{c.terminos}</span>}
      <BotonEnviar className="btn btn-primario btn-lg ancho">Crear cuenta</BotonEnviar>
      <p className="chico texto-2 centrado">¿Ya tienes cuenta? <Link href="/ingresar" className="enlace-simple">Ingresa</Link></p>
    </form>
  );
}
