"use client";
import { useActionState } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { verificarPersonal, type Estado } from "@/lib/acciones-auth";
import { BotonEnviar, CodigoSeis, Temporizador } from "@/components/ui/Cliente";

export function FormDosPasos({ expira }: { expira?: string }) {
  const [e, accion] = useActionState<Estado, FormData>(verificarPersonal, undefined);
  return (
    <form action={accion} className="form">
      <CodigoSeis estado={e?.tipo === "incorrecto" ? "error" : undefined} />
      {e?.error && <div className="error-general"><CircleX className="i" /><span>{e.error} {e.tipo === "vencido" && <Link href="/personal" className="enlace-simple">Ingresar de nuevo</Link>}</span></div>}
      {expira && <Temporizador hasta={expira} />}
      <BotonEnviar className="btn btn-secundario btn-lg ancho">Verificar e ingresar</BotonEnviar>
    </form>
  );
}
