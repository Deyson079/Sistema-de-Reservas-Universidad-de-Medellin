import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSesion } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Plantillas de correo" };
const NOMBRES: Record<string, string> = { bienvenida: "Bienvenida", reserva_confirmada: "Reserva confirmada (con QR)", factura_generada: "Factura generada", pago_recibido: "Pago recibido", pago_aprobado: "Pago aprobado", pago_rechazado: "Pago rechazado", recordatorio: "Recordatorio 24 horas antes", reserva_vencida: "Reserva vencida", reserva_cancelada: "Reserva cancelada" };

export default async function Correos() {
  const s = await getSesion();
  if (process.env.MODO_DEMO !== "true" && (!s || s.k !== "p")) redirect("/personal");
  return (
    <div className="contenedor" style={{ padding: "24px 0 80px" }}>
      <Link href={s?.k === "p" ? "/admin/configuracion?tab=avisos" : "/"} className="miga"><ArrowLeft className="i i-sm" />Volver</Link>
      <div className="pag-cab" style={{ marginTop: 4 }}><div><h1>Correos transaccionales</h1><p>Plantillas de 600 px con la marca de la Universidad de Medellín. Abre cada una para verla en tamaño real o importarla a Figma.</p></div></div>
      <div className="correos-grid">{Object.entries(NOMBRES).map(([k, n]) => <Link key={k} href={`/correos/${k}`} className="correo-card" target="_blank"><div className="marco-mini"><iframe src={`/correos/${k}`} title={n} loading="lazy" tabIndex={-1} /></div><b>{n}</b></Link>)}</div>
    </div>
  );
}
