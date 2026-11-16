import { getConfig } from "@/lib/config";
import { BadgeRol } from "@/components/ui/Chip";
import { FormComunidad } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registro comunidad Universidad de Medellín" };

export default async function RegistroComunidad() {
  const cfg = await getConfig();
  return (
    <>
      <div className="pasos-mini" aria-hidden><i className="on" /><i /></div>
      <BadgeRol tipo="comunidad" />
      <h1 style={{ marginTop: 14 }}>Cuenta de comunidad</h1>
      <p className="intro">Con tu correo institucional reservas sin costo y tus reservas quedan confirmadas al instante.</p>
      <FormComunidad dominios={cfg.dominios} />
    </>
  );
}
