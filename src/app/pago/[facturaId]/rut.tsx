"use client";
import { useActionState } from "react";
import { CircleX } from "lucide-react";
import { subirRut } from "@/lib/acciones-portal";
import type { Estado } from "@/lib/acciones-auth";
import { BotonEnviar, ZonaArchivo } from "@/components/ui/Cliente";

export function FormRut({ volver }: { volver: string }) {
  const [e, a] = useActionState<Estado, FormData>(subirRut, undefined);
  return (
    <form action={a} className="form">
      <input type="hidden" name="volver" value={volver} />
      <ZonaArchivo name="rut" aceptar="application/pdf" texto="Arrastra tu RUT aquí o elige el archivo" ayuda="PDF de máximo 5 MB." requerido />
      {(e?.campos?.rut || e?.error) && <div className="error-general"><CircleX className="i" /><span>{e?.campos?.rut ?? e?.error}</span></div>}
      <div><BotonEnviar>Subir RUT</BotonEnviar></div>
    </form>
  );
}
