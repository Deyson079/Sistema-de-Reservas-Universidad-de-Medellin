"use client";
import { useActionState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { registrarCaja } from "@/lib/acciones-staff";
import type { Estado } from "@/lib/acciones-auth";
import { Campo } from "@/components/ui/Campo";
import { BotonEnviar } from "@/components/ui/Cliente";

export function FormCaja({ numero, total }: { numero?: string; total?: number }) {
  const [e, a] = useActionState<Estado, FormData>(registrarCaja, undefined);
  return (
    <form action={a} className="form" key={e?.ok ? "ok" : "f"}>
      {e?.ok && <div className="aviso aviso--exito" role="status"><CircleCheck className="i" /><span>{e.tipo}</span></div>}
      {e?.error && <div className="error-general"><CircleX className="i" /><span>{e.error}</span></div>}
      <div className="form-grid">
        <Campo etiqueta="Número de factura" name="numero" defaultValue={e?.ok ? "" : e?.valores?.numero ?? numero} error={e?.campos?.numero} placeholder="FV-2026-000000" required />
        <Campo etiqueta="Número del recibo de caja" name="referencia" defaultValue={e?.ok ? "" : e?.valores?.referencia} error={e?.campos?.referencia} required />
        <Campo etiqueta="Valor recibido" name="valor" inputMode="numeric" defaultValue={total ? String(total) : ""} ayuda="Debe ser igual al total de la factura." required />
        <div className="campo"><label htmlFor="medio">Medio</label><select id="medio" name="medio" className="input"><option>Efectivo</option><option>Datáfono</option><option>Cheque</option></select></div>
      </div>
      <div><BotonEnviar className="btn btn-primario btn-lg">Registrar pago y confirmar reserva</BotonEnviar></div>
    </form>
  );
}
