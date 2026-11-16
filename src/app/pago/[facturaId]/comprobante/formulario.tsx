"use client";
import { useActionState } from "react";
import { CircleX, ShieldCheck } from "lucide-react";
import { subirComprobante } from "@/lib/acciones-portal";
import type { Estado } from "@/lib/acciones-auth";
import { Campo } from "@/components/ui/Campo";
import { BotonEnviar, ZonaArchivo } from "@/components/ui/Cliente";

export function FormComprobante({ facturaId, total, hoy }: { facturaId: string; total: number; hoy: string }) {
  const [e, a] = useActionState<Estado, FormData>(subirComprobante, undefined);
  const c = e?.campos ?? {};
  return (
    <form action={a} className="tarjeta form">
      <input type="hidden" name="facturaId" value={facturaId} />
      {e?.error && <div className="error-general"><CircleX className="i" /><span>{e.error}</span></div>}
      <div className="campo"><label>Comprobante</label><ZonaArchivo name="comprobante" requerido texto="Arrastra el comprobante aquí o elige el archivo" ayuda="PDF, JPG o PNG de máximo 5 MB." />{c.comprobante && <span className="campo-ayuda" style={{ color: "var(--error)" }}><CircleX className="i" />{c.comprobante}</span>}</div>
      <div className="form-grid">
        <Campo etiqueta="Número de referencia o aprobación" name="referencia" error={c.referencia} required full />
        <Campo etiqueta="Fecha del pago" name="fecha" type="date" max={hoy} defaultValue={hoy} error={c.fecha} required />
        <Campo etiqueta="Valor pagado" name="valor" inputMode="numeric" defaultValue={String(total)} error={c.valor} ayuda={`El total de la factura es $${total.toLocaleString("es-CO")}.`} required />
      </div>
      <div className="aviso aviso--info"><ShieldCheck className="i" /><span>Al enviarlo, tu reserva pasa a <b style={{ display: "inline" }}>En validación por Tesorería</b>. Te avisamos por correo cuando quede confirmada.</span></div>
      <BotonEnviar className="btn btn-primario btn-lg ancho" pendiente="Enviando…">Enviar comprobante</BotonEnviar>
    </form>
  );
}
