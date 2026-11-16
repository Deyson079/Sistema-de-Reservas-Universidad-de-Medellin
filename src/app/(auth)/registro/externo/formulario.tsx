"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Phone, User, Building2, Info } from "lucide-react";
import { registrarExterno, type Estado } from "@/lib/acciones-auth";
import { Campo } from "@/components/ui/Campo";
import { BotonEnviar, CampoPassword, ZonaArchivo } from "@/components/ui/Cliente";

export function FormExterno({ tarifa, horas }: { tarifa: string; horas: number }) {
  const [e, accion] = useActionState<Estado, FormData>(registrarExterno, undefined);
  const v = e?.valores ?? {};
  const c = e?.campos ?? {};
  const [tipo, setTipo] = useState(v.tipoPersona ?? "natural");
  const j = tipo === "juridica";
  return (
    <form action={accion} className="form" noValidate>
      <div className="aviso aviso--alerta"><Info className="i" /><span><b>Las reservas de externos tienen costo</b>Desde {tarifa} por hora. Tu horario queda apartado {horas} horas mientras pagas, y Tesorería valida el pago.</span></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="negrita chico" style={{ marginBottom: 6 }}>Tipo de persona</legend>
        <div className="segmento">
          <label><input type="radio" name="tipoPersona" value="natural" checked={!j} onChange={() => setTipo("natural")} /><User className="i i-sm" />Persona natural</label>
          <label><input type="radio" name="tipoPersona" value="juridica" checked={j} onChange={() => setTipo("juridica")} /><Building2 className="i i-sm" />Persona jurídica</label>
        </div>
      </fieldset>
      <div className="form-grid">
        <Campo etiqueta={j ? "Razón social" : "Nombre completo"} name="nombre" defaultValue={v.nombre} error={c.nombre} autoComplete={j ? "organization" : "name"} full required />
        <Campo etiqueta={j ? "NIT" : "Cédula"} name="nitCedula" defaultValue={v.nitCedula} error={c.nitCedula} placeholder={j ? "900.000.000-0" : "1.000.000.000"} required />
        <Campo etiqueta="Celular" name="celular" type="tel" inputMode="numeric" icono={<Phone className="i" />} defaultValue={v.celular} error={c.celular} autoComplete="tel" placeholder="300 000 0000" required />
        <Campo etiqueta="Correo" name="correo" type="email" icono={<Mail className="i" />} defaultValue={v.correo} error={c.correo} autoComplete="email" full required />
        <Campo etiqueta="Dirección de facturación" name="direccion" defaultValue={v.direccion} error={c.direccion} autoComplete="street-address" required />
        <Campo etiqueta="Ciudad" name="ciudad" defaultValue={v.ciudad ?? "Medellín"} error={c.ciudad} autoComplete="address-level2" required />
        <div className="full"><CampoPassword fortaleza autoComplete="new-password" error={c.password} /></div>
        <div className="full"><CampoPassword name="confirmar" etiqueta="Confirma la contraseña" autoComplete="new-password" error={c.confirmar} /></div>
        <div className="campo full">
          <label>RUT en PDF <span className="opc">(opcional ahora, obligatorio antes del primer pago)</span></label>
          <ZonaArchivo name="rut" aceptar="application/pdf" texto="Arrastra tu RUT aquí o elige el archivo" ayuda="PDF de máximo 5 MB." />
          {c.rut && <span className="campo-ayuda" style={{ color: "var(--error)" }}>{c.rut}</span>}
        </div>
      </div>
      <label className="check"><input type="checkbox" name="terminos" required /><span>Acepto los <Link href="/terminos" target="_blank">términos y condiciones</Link>, el <Link href="/reglamento" target="_blank">reglamento de uso</Link> y la <Link href="/terminos#datos" target="_blank">política de tratamiento de datos</Link> (Ley 1581 de 2012).</span></label>
      {c.terminos && <span className="campo-ayuda" style={{ color: "var(--error)" }}>{c.terminos}</span>}
      <BotonEnviar className="btn btn-primario btn-lg ancho">Crear cuenta</BotonEnviar>
      <p className="chico texto-2 centrado">¿Ya tienes cuenta? <Link href="/ingresar" className="enlace-simple">Ingresa</Link></p>
    </form>
  );
}
