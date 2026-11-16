"use client";
import { useActionState } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { recuperarPaso3, type Estado } from "@/lib/acciones-auth";
import { BotonEnviar, CampoPassword } from "@/components/ui/Cliente";

export default function NuevaContrasena() {
  const [e, accion] = useActionState<Estado, FormData>(recuperarPaso3, undefined);
  return (
    <>
      <div className="pasos-mini" aria-label="Paso 3 de 3"><i className="on" /><i className="on" /><i className="on" /></div>
      <h1>Nueva contraseña</h1>
      <p className="intro">Elige una contraseña que no hayas usado antes.</p>
      <form action={accion} className="form">
        {e?.error && <div className="error-general"><CircleX className="i" /><span>{e.error} <Link href="/recuperar" className="enlace-simple">Empezar de nuevo</Link></span></div>}
        <CampoPassword fortaleza autoComplete="new-password" etiqueta="Nueva contraseña" error={e?.campos?.password} />
        <CampoPassword name="confirmar" etiqueta="Confirma la contraseña" autoComplete="new-password" error={e?.campos?.confirmar} />
        <BotonEnviar className="btn btn-primario btn-lg ancho">Guardar contraseña</BotonEnviar>
      </form>
    </>
  );
}
