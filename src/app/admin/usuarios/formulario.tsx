"use client";
import { useActionState } from "react";
import { CircleCheck, KeyRound } from "lucide-react";
import { guardarPersonal, restablecerPasswordUsuario } from "@/lib/acciones-staff";
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
      <Campo etiqueta={p ? "Nueva contraseña temporal" : "Contraseña temporal"} name="password" type="text" autoComplete="off" error={c.password} opcional={!!p} ayuda="Mínimo 10 caracteres. La persona ingresa con su correo y esta contraseña." />
      <div><BotonEnviar>{p ? "Guardar cambios" : "Crear cuenta"}</BotonEnviar></div>
    </form>
  );
}

/** Genera una contraseña temporal para un usuario y la muestra una sola vez para entregársela. */
export function RestablecerPassword({ id, nombre }: { id: string; nombre: string }) {
  const [e, a] = useActionState<Estado, FormData>(restablecerPasswordUsuario, undefined);
  if (e?.ok && e.valores?.password) return (
    <div className="aviso aviso--exito" role="status" style={{ textAlign: "left" }}>
      <KeyRound className="i" />
      <span>Contraseña temporal de {nombre}: <b style={{ fontFamily: "monospace", fontSize: 15, letterSpacing: ".04em", userSelect: "all" }}>{e.valores.password}</b><br /><small>Entrégasela por un medio seguro. Solo se muestra ahora; pídele que la cambie en Mi perfil.</small></span>
    </div>
  );
  return (
    <form action={a} onSubmit={(ev) => { if (!confirm(`¿Generar una contraseña temporal para ${nombre}? La actual dejará de funcionar.`)) ev.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      {e?.error && <span className="mini" style={{ color: "var(--error)" }}>{e.error} </span>}
      <BotonEnviar className="btn btn-fantasma btn-sm"><KeyRound className="i i-sm" />Restablecer contraseña</BotonEnviar>
    </form>
  );
}
