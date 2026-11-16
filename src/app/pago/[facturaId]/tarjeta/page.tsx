import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cargarFactura } from "../../comun";
import { moneda } from "@/lib/formato";
import { FormTarjeta } from "./formulario";

export const metadata = { title: "Pago con tarjeta" };

export default async function Tarjeta({ params }: { params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { f } = await cargarFactura(facturaId);
  return (
    <>
      <Link href={`/pago/${f.id}/metodo`} className="miga"><ArrowLeft className="i i-sm" />Otros métodos</Link>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><h1>Tarjeta crédito o débito</h1></div></div>
      <div className="tarjeta"><FormTarjeta facturaId={f.id} total={moneda(f.total)} demo={process.env.MODO_DEMO === "true"} /></div>
    </>
  );
}
