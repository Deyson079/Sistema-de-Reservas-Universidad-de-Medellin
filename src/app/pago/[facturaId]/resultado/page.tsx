import Link from "next/link";
import { Check, X, Hourglass, ShieldCheck, RotateCcw, CreditCard, FileText } from "lucide-react";
import { cargarFactura } from "../../comun";
import { confirmarPse } from "@/lib/acciones-portal";
import { moneda, fechaHora } from "@/lib/formato";
import { METODOS } from "@/lib/estados";
import { BotonEnviar } from "@/components/ui/Cliente";

export const metadata = { title: "Resultado del pago" };

export default async function Resultado({ params, searchParams }: { params: Promise<{ facturaId: string }>; searchParams: Promise<{ r?: string; m?: string; ref?: string }> }) {
  const { facturaId } = await params;
  const { r = "aprobado", m = "tarjeta", ref } = await searchParams;
  const { f } = await cargarFactura(facturaId);
  const det = <dl className="dl" style={{ fontSize: 14 }}><dt>Factura</dt><dd>{f.numero}</dd><dt>Método</dt><dd>{METODOS[m]}</dd>{ref && <><dt>Referencia</dt><dd>{ref}</dd></>}<dt>Fecha</dt><dd>{fechaHora(new Date())}</dd><dt>Valor</dt><dd className="total">{moneda(f.total)}</dd></dl>;
  if (r === "rechazado") return (
    <div className="resultado-pago">
      <span className="circ" style={{ background: "var(--error)" }}><X className="i" strokeWidth={3} /></span>
      <h1>Pago rechazado</h1>
      <p className="texto-2">Tu banco no aprobó la transacción. No se hizo ningún cobro. Revisa los datos o prueba con otro método.</p>
      <div className="tarjeta">{det}</div>
      <div className="fila mt-3" style={{ justifyContent: "center" }}><Link href={`/pago/${f.id}/tarjeta`} className="btn btn-primario btn-lg"><RotateCcw className="i" />Reintentar</Link><Link href={`/pago/${f.id}/metodo`} className="btn btn-contorno btn-lg">Usar otro método</Link></div>
    </div>
  );
  if (r === "pendiente") return (
    <div className="resultado-pago">
      <span className="circ" style={{ background: "var(--alerta)" }}><Hourglass className="i" /></span>
      <h1>Pago pendiente</h1>
      <p className="texto-2">PSE está esperando la respuesta de tu banco. Puede tardar unos minutos; te avisaremos por correo cuando se confirme.</p>
      <div className="tarjeta">{det}</div>
      {process.env.MODO_DEMO === "true" && (
        <form action={confirmarPse} className="aviso aviso--demo mt-2" style={{ alignItems: "center" }}><input type="hidden" name="facturaId" value={f.id} /><span>Pasarela de prueba: simula que el banco aprobó el pago.</span><BotonEnviar className="btn btn-secundario btn-sm acc">Simular aprobación</BotonEnviar></form>
      )}
      <div className="fila mt-3" style={{ justifyContent: "center" }}><Link href={`/portal/reservas/${f.reserva.codigo}`} className="btn btn-primario btn-lg">Ver mi reserva</Link></div>
    </div>
  );
  return (
    <div className="resultado-pago">
      <span className="circ" style={{ background: "var(--exito)" }}><Check className="i" strokeWidth={3} /></span>
      <h1>Pago aprobado</h1>
      <p className="texto-2">Lo enviamos a Tesorería para validación. Cuando lo valide, tu reserva queda confirmada y te llega el código QR.</p>
      <div className="tarjeta">{det}<div className="aviso aviso--info mt-2"><ShieldCheck className="i" /><span><b>En validación por Tesorería</b>Suele tardar menos de 1 día hábil.</span></div></div>
      <div className="fila mt-3" style={{ justifyContent: "center" }}><Link href={`/portal/reservas/${f.reserva.codigo}`} className="btn btn-primario btn-lg">Ver mi reserva</Link><Link href={`/factura/${f.numero}`} className="btn btn-contorno btn-lg"><FileText className="i" />Ver factura</Link></div>
    </div>
  );
}
