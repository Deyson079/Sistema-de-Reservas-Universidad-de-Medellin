"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { recuperarPaso1, type Estado } from "@/lib/acciones-auth";
import { Campo } from "@/components/ui/Campo";
import { BotonEnviar } from "@/components/ui/Cliente";

export default function Recuperar() {
  const [e, accion] = useActionState<Estado, FormData>(recuperarPaso1, undefined);
  return (
    <>
      <div className="pasos-mini" aria-label="Paso 1 de 3"><i className="on" /><i /><i /></div>
      <h1>Recupera tu contraseña</h1>
      <p className="intro">Escribe el correo de tu cuenta y te enviamos un código de 6 dígitos.</p>
      <form action={accion} className="form">
        <Campo etiqueta="Correo" name="correo" type="email" icono={<Mail className="i" />} defaultValue={e?.valores?.correo} error={e?.campos?.correo} autoComplete="email" required />
        <BotonEnviar className="btn btn-primario btn-lg ancho">Enviar código</BotonEnviar>
        <Link href="/ingresar" className="btn btn-fantasma">Volver a Ingresar</Link>
      </form>
    </>
  );
}
