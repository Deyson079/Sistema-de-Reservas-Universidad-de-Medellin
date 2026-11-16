import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Landmark, Smartphone, ArrowLeftRight, ChevronRight, ArrowLeft } from "lucide-react";
import { cargarFactura } from "../../comun";

export const metadata = { title: "Método de pago" };

export default async function Metodo({ params }: { params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { u, f } = await cargarFactura(facturaId);
  if (!u.facturacion?.rutUrl) redirect(`/pago/${f.id}`);
  const base = `/pago/${f.id}`;
  return (
    <>
      <Link href={base} className="miga"><ArrowLeft className="i i-sm" />Resumen</Link>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><span className="mini texto-2">Paso 2 de 2</span><h1>¿Cómo quieres pagar?</h1><p>Después del pago, Tesorería lo valida y tu reserva queda confirmada.</p></div></div>
      <div className="metodos">
        <Link href={`${base}/tarjeta`} className="metodo"><span className="ic" style={{ background: "var(--rojo-50)", color: "var(--rojo-600)" }}><CreditCard className="i" /></span><div><b>Tarjeta crédito o débito</b><span>Aprobación inmediata</span></div><span className="franquicias"><i style={{ color: "#1A1F71" }}>VISA</i><i style={{ color: "#EB001B" }}>MC</i><i style={{ color: "#2E77BC" }}>AMEX</i><ChevronRight className="i" /></span></Link>
        <Link href={`${base}/pse`} className="metodo"><span className="ic" style={{ background: "var(--info-bg)", color: "var(--info)" }}><Landmark className="i" /></span><div><b>PSE</b><span>Débito desde tu cuenta de ahorros o corriente</span></div><ChevronRight className="i" /></Link>
        <Link href={`${base}/billetera?metodo=nequi`} className="metodo"><span className="ic" style={{ background: "#F3E8FF", color: "#6B21A8" }}><Smartphone className="i" /></span><div><b>Nequi</b><span>Aprueba la notificación en tu celular</span></div><ChevronRight className="i" /></Link>
        <Link href={`${base}/billetera?metodo=daviplata`} className="metodo"><span className="ic" style={{ background: "#FEE2E2", color: "#B91C1C" }}><Smartphone className="i" /></span><div><b>Daviplata</b><span>Aprueba la notificación en tu celular</span></div><ChevronRight className="i" /></Link>
        <Link href={`${base}/transferencia`} className="metodo"><span className="ic" style={{ background: "var(--gris-50)", color: "var(--tinta)" }}><ArrowLeftRight className="i" /></span><div><b>Transferencia o consignación</b><span>Paga en tu banco y sube el comprobante</span></div><ChevronRight className="i" /></Link>
      </div>
    </>
  );
}
