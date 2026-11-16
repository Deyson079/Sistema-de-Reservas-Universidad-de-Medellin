import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileWarning, CircleCheck, Upload } from "lucide-react";
import { cargarFactura } from "../comun";
import { ChipEstado } from "@/components/ui/Chip";
import { FormRut } from "./rut";

export const metadata = { title: "Resumen de pago" };

export default async function ResumenPago({ params }: { params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { u, f } = await cargarFactura(facturaId);
  if (f.estado === "pagada" || f.reserva.estado === "en_validacion") redirect(`/portal/reservas/${f.reserva.codigo}`);
  const bloqueada = f.estado !== "sin_pagar" || !["pendiente_pago", "rechazada"].includes(f.reserva.estado);
  return (
    <>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><span className="mini texto-2">Paso 1 de 2</span><h1>Resumen de pago</h1><p>Revisa el valor y elige cómo quieres pagar.</p></div><ChipEstado estado={f.reserva.estado} /></div>
      {bloqueada ? <div className="aviso aviso--error"><FileWarning className="i" /><span><b>Esta factura ya no admite pagos</b>La reserva está {f.reserva.estado.replace("_", " ")}. <Link href="/portal/reservar" className="enlace-simple">Haz una nueva reserva</Link>.</span></div> : (
        <div style={{ display: "grid", gap: 16 }}>
          {f.reserva.estado === "rechazada" && f.pagos[0]?.motivoRechazo && <div className="aviso aviso--error"><FileWarning className="i" /><span><b>Tu pago anterior fue rechazado</b>{f.pagos[0].motivoRechazo}</span></div>}
          <section className="tarjeta">
            <h2 className="t-tarjeta">RUT del cliente</h2>
            {u.facturacion?.rutUrl ? <p className="fila chico" style={{ color: "var(--exito)", fontWeight: 600, margin: "8px 0 0" }}><CircleCheck className="i i-sm" />Tu RUT ya está cargado.</p>
              : <><p className="chico texto-2">Antes de tu primer pago necesitamos tu RUT en PDF para emitir la factura.</p><FormRut volver={`/pago/${f.id}`} /></>}
          </section>
          <div className="fila">
            {u.facturacion?.rutUrl ? <Link href={`/pago/${f.id}/metodo`} className="btn btn-primario btn-lg">Elegir método de pago<ArrowRight className="i" /></Link> : <span className="btn btn-lg" aria-disabled="true" style={{ background: "var(--gris-200)", color: "var(--gris-500)" }}>Elegir método de pago</span>}
            <Link href={`/pago/${f.id}/comprobante`} className="btn btn-contorno btn-lg"><Upload className="i" />Ya pagué: subir comprobante</Link>
          </div>
        </div>
      )}
    </>
  );
}
