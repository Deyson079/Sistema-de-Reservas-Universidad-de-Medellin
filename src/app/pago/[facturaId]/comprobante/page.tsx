import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cargarFactura } from "../../comun";
import { ahora } from "@/lib/formato";
import { FormRut } from "../rut";
import { FormComprobante } from "./formulario";

export const metadata = { title: "Subir comprobante" };

export default async function Comprobante({ params }: { params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { u, f } = await cargarFactura(facturaId);
  if (f.estado !== "sin_pagar" || !["pendiente_pago", "rechazada"].includes(f.reserva.estado)) redirect(`/portal/reservas/${f.reserva.codigo}`);
  return (
    <>
      <Link href={`/pago/${f.id}/transferencia`} className="miga"><ArrowLeft className="i i-sm" />Ver datos bancarios</Link>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><h1>Subir comprobante</h1><p>De tu transferencia o consignación a la cuenta de la Universidad de Medellín.</p></div></div>
      {u.facturacion?.rutUrl ? <FormComprobante facturaId={f.id} total={f.total} hoy={ahora().iso} /> : <div className="tarjeta"><h2 className="t-tarjeta">Primero, tu RUT</h2><p className="chico texto-2">Antes de tu primer pago necesitamos tu RUT en PDF.</p><FormRut volver={`/pago/${f.id}/comprobante`} /></div>}
    </>
  );
}
