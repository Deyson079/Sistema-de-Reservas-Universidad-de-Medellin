"use client";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { guardarPersonal } from "@/lib/acciones-staff";
import type { Estado } from "@/lib/acciones-auth";
import { Campo, Seleccion } from "@/components/ui/Campo";
import { BotonEnviar } from "@/components/ui/Cliente";

export function FormPersonal({ p }: { p?: { id: string; nombre: string; correo: string; rol: string } }) {
  const [e, a] = useActionState<Estado, FormData>(guardarPersonal, undefined);
  const c = e?.campos ?? {};
  return (
    <form action={a} className="form" key={p?.id ?? (e?.ok ? String(Math.random()) : "nuevo")}>
      {e?.ok && <div className="aviso aviso--exito" role="status"><CircleCheck className="i" /><span>{e.tipo}</span></div>}
      {p && <input type="hidden" name="id" value={p.id} />}
      <Campo etiqueta="Nombre completo" name="nombre" defaultValue={p?.nombre} error={c.nombre} required />
      <Campo etiqueta="Correo institucional" name="correo" type="email" defaultValue={p?.correo} error={c.correo} required />
      <Seleccion etiqueta="Rol" name="rol" defaultValue={p?.rol ?? "tesoreria"}><option value="tesoreria">Tesorería</option><option value="bienestar">Bienestar · Deportes</option><option value="administrador">Administrador</option></Seleccion>
      <Campo etiqueta={p ? "Nueva contraseña temporal" : "Contraseña temporal"} name="password" type="text" autoComplete="off" error={c.password} opcional={!!p} ayuda="Mínimo 10 caracteres. La persona ingresa con verificación en dos pasos." />
      <div><BotonEnviar>{p ? "Guardar cambios" : "Crear cuenta"}</BotonEnviar></div>
    </form>
  );
}
