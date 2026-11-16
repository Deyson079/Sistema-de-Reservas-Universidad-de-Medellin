import Link from "next/link";
import { ArrowLeft, Upload, Info } from "lucide-react";
import { cargarFactura } from "../../comun";
import { getConfig } from "@/lib/config";
import { moneda } from "@/lib/formato";
import { Copiar } from "@/components/ui/Cliente";

export const metadata = { title: "Transferencia o consignación" };

export default async function Transferencia({ params }: { params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { f } = await cargarFactura(facturaId);
  const b = (await getConfig()).datosBancarios;
  const filas: Array<[string, string]> = [["Banco", b.banco], ["Tipo de cuenta", b.tipoCuenta], ["Número de cuenta", b.numero], ["Titular", b.titular], ["NIT", b.nit], ["Referencia de pago", f.numero], ["Valor exacto", moneda(f.total)]];
  return (
    <>
      <Link href={`/pago/${f.id}/metodo`} className="miga"><ArrowLeft className="i i-sm" />Otros métodos</Link>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><h1>Transferencia o consignación</h1><p>Paga a la cuenta de la Universidad de Medellín y sube el comprobante.</p></div></div>
      <div className="datos-banco"><div>Datos bancarios de la Universidad de Medellín</div>{filas.map(([k, v]) => <div key={k}><span>{k}</span><span className="fila" style={{ gap: 8 }}><b>{v}</b><Copiar texto={v} /></span></div>)}</div>
      <div className="aviso aviso--alerta mt-2"><Info className="i" /><span>Escribe <b style={{ display: "inline" }}>{f.numero}</b> como referencia o descripción, y paga el valor exacto. Así Tesorería encuentra tu pago más rápido.</span></div>
      <Link href={`/pago/${f.id}/comprobante`} className="btn btn-primario btn-lg mt-3"><Upload className="i" />Ya pagué: subir comprobante</Link>
    </>
  );
}
