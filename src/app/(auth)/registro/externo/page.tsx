import { getConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { moneda } from "@/lib/formato";
import { BadgeRol } from "@/components/ui/Chip";
import { FormExterno } from "./formulario";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registro externo" };

export default async function RegistroExterno() {
  const cfg = await getConfig();
  const min = (await db.cancha.aggregate({ _min: { tarifaHora: true } }))._min.tarifaHora ?? 0;
  return (
    <>
      <div className="pasos-mini" aria-hidden><i className="on" /><i /></div>
      <BadgeRol tipo="externo" />
      <h1 style={{ marginTop: 14 }}>Cuenta de externo</h1>
      <p className="intro">Para personas naturales o empresas. Necesitamos tus datos de facturación.</p>
      <FormExterno tarifa={moneda(min)} horas={cfg.horasParaPagar} />
    </>
  );
}
