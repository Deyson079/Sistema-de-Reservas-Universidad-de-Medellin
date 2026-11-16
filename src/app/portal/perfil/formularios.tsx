"use client";
import { useActionState } from "react";
import { CircleCheck, CircleX, User, Building2 } from "lucide-react";
import { actualizarDatos, actualizarFacturacion, cambiarPassword, solicitarCambioCorreo, confirmarCambioCorreo } from "@/lib/acciones-portal";
import type { Estado } from "@/lib/acciones-auth";
import { Campo } from "@/components/ui/Campo";
import { BotonEnviar, CampoPassword, CodigoSeis, ZonaArchivo } from "@/components/ui/Cliente";

const Ok = ({ e }: { e: Estado }) => e?.ok && e.tipo && e.tipo !== "codigo" ? <div className="aviso aviso--exito" role="status"><CircleCheck className="i" /><span>{e.tipo}</span></div> : e?.error ? <div className="aviso aviso--error"><CircleX className="i" /><span>{e.error}</span></div> : null;

export function FormDatos({ u }: { u: { nombres: string; apellidos: string; celular: string; programa: string | null; documento: string; tipoDocumento: string; comunidad: boolean } }) {
  const [e, a] = useActionState<Estado, FormData>(actualizarDatos, undefined);
  return (
    <form action={a} className="form">
      <Ok e={e} />
      <div className="form-grid">
        <Campo etiqueta={u.comunidad ? "Nombres" : "Nombre o razón social"} name="nombres" defaultValue={u.nombres} error={e?.campos?.nombres} required />
        {u.comunidad && <Campo etiqueta="Apellidos" name="apellidos" defaultValue={u.apellidos} error={e?.campos?.apellidos} />}
        <Campo etiqueta="Documento" name="doc" defaultValue={`${u.tipoDocumento} ${u.documento}`} disabled ayuda="Para cambiarlo, escribe a Bienestar Universitario." />
        <Campo etiqueta="Celular" name="celular" type="tel" defaultValue={u.celular} error={e?.campos?.celular} required />
        {u.comunidad && <Campo etiqueta="Programa o dependencia" name="programa" defaultValue={u.programa ?? ""} />}
      </div>
      <div><BotonEnviar>Guardar cambios</BotonEnviar></div>
    </form>
  );
}

export function FormFacturacion({ f, rut }: { f: { tipoPersona: string; razonSocial: string; nitCedula: string; direccion: string; ciudad: string } | null; rut: string | null }) {
  const [e, a] = useActionState<Estado, FormData>(actualizarFacturacion, undefined);
  return (
    <form action={a} className="form">
      <Ok e={e} />
      <div className="segmento" role="radiogroup" aria-label="Tipo de persona">
        <label><input type="radio" name="tipoPersona" value="natural" defaultChecked={f?.tipoPersona !== "juridica"} /><User className="i i-sm" />Persona natural</label>
        <label><input type="radio" name="tipoPersona" value="juridica" defaultChecked={f?.tipoPersona === "juridica"} /><Building2 className="i i-sm" />Persona jurídica</label>
      </div>
      <div className="form-grid">
        <Campo etiqueta="Nombre o razón social" name="razonSocial" defaultValue={f?.razonSocial} error={e?.campos?.razonSocial} full required />
        <Campo etiqueta="NIT o cédula" name="nitCedula" defaultValue={f?.nitCedula} error={e?.campos?.nitCedula} required />
        <Campo etiqueta="Ciudad" name="ciudad" defaultValue={f?.ciudad} error={e?.campos?.ciudad} required />
        <Campo etiqueta="Dirección" name="direccion" defaultValue={f?.direccion} error={e?.campos?.direccion} full required />
        <div className="campo full"><label>RUT en PDF {rut ? <span className="opc">(ya cargado; sube otro para reemplazarlo)</span> : <span className="opc" style={{ color: "var(--alerta)" }}>(obligatorio antes de tu primer pago)</span>}</label>
          {rut && <a href={rut} target="_blank" className="enlace-simple chico">Ver RUT actual</a>}
          <ZonaArchivo name="rut" aceptar="application/pdf" texto="Arrastra tu RUT aquí o elige el archivo" ayuda="PDF de máximo 5 MB." />
          {e?.campos?.rut && <span className="campo-ayuda" style={{ color: "var(--error)" }}>{e.campos.rut}</span>}
        </div>
      </div>
      <div><BotonEnviar>Guardar datos de facturación</BotonEnviar></div>
    </form>
  );
}

export function FormPassword() {
  const [e, a] = useActionState<Estado, FormData>(cambiarPassword, undefined);
  return (
    <form action={a} className="form" key={e?.ok ? "ok" : "f"}>
      <Ok e={e} />
      <CampoPassword name="actual" etiqueta="Contraseña actual" error={e?.campos?.actual} />
      <CampoPassword name="password" etiqueta="Nueva contraseña" fortaleza autoComplete="new-password" error={e?.campos?.password} />
      <CampoPassword name="confirmar" etiqueta="Confirma la nueva contraseña" autoComplete="new-password" error={e?.campos?.confirmar} />
      <div><BotonEnviar>Cambiar contraseña</BotonEnviar></div>
    </form>
  );
}

export function FormCorreo({ actual, demo }: { actual: string; demo?: string }) {
  const [e1, pedir] = useActionState<Estado, FormData>(solicitarCambioCorreo, undefined);
  const [e2, confirmar] = useActionState<Estado, FormData>(confirmarCambioCorreo, undefined);
  if (e2?.ok) return <Ok e={e2} />;
  const nuevo = e1?.valores?.nuevo ?? e2?.valores?.nuevo;
  if (nuevo && (e1?.tipo === "codigo" || e2?.tipo === "codigo")) return (
    <form action={confirmar} className="form">
      <input type="hidden" name="nuevo" value={nuevo} />
      <p className="chico" style={{ margin: 0 }}>Escribe el código que enviamos a <b>{nuevo}</b>.</p>
      {demo && <div className="aviso aviso--demo">Modo de pruebas: el código aparece en la terminal del servidor.</div>}
      <CodigoSeis estado={e2?.error ? "error" : undefined} />
      <Ok e={e2} />
      <div><BotonEnviar>Confirmar nuevo correo</BotonEnviar></div>
    </form>
  );
  return (
    <form action={pedir} className="form">
      <Campo etiqueta="Correo actual" name="actual" defaultValue={actual} disabled />
      <Campo etiqueta="Nuevo correo" name="nuevo" type="email" error={e1?.campos?.nuevo} required />
      <div><BotonEnviar className="btn btn-secundario">Enviar código de verificación</BotonEnviar></div>
    </form>
  );
}
