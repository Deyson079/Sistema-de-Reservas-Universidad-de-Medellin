import Link from "next/link";
import { ArrowLeft, Smartphone, Info } from "lucide-react";
import { cargarFactura } from "../../comun";
import { pagarConBilletera } from "@/lib/acciones-portal";
import { moneda } from "@/lib/formato";
import { BotonEnviar } from "@/components/ui/Cliente";

export const metadata = { title: "Pago con Nequi o Daviplata" };

export default async function Billetera({ params, searchParams }: { params: Promise<{ facturaId: string }>; searchParams: Promise<{ metodo?: string }> }) {
  const { facturaId } = await params;
  const { metodo = "nequi" } = await searchParams;
  const { u, f } = await cargarFactura(facturaId);
  const nombre = metodo === "daviplata" ? "Daviplata" : "Nequi";
  return (
    <>
      <Link href={`/pago/${f.id}/metodo`} className="miga"><ArrowLeft className="i i-sm" />Otros métodos</Link>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><h1>Pago con {nombre}</h1><p>Te enviaremos una notificación a tu celular para que apruebes el pago.</p></div></div>
      <form action={pagarConBilletera} className="tarjeta form">
        <input type="hidden" name="facturaId" value={f.id} /><input type="hidden" name="metodo" value={metodo} />
        <div className="campo"><label htmlFor="celular">Celular de tu cuenta {nombre}</label><div className="control"><Smartphone className="i" /><input id="celular" name="celular" type="tel" inputMode="numeric" className="input" defaultValue={u.celular} required style={{ paddingLeft: 42 }} /></div></div>
        <div className="aviso aviso--info"><Info className="i" /><span>Abre {nombre}, revisa la notificación de pago por {moneda(f.total)} y apruébala en los próximos 5 minutos.</span></div>
        <BotonEnviar className="btn btn-primario btn-lg ancho" pendiente="Esperando tu aprobación…">Enviar solicitud de pago</BotonEnviar>
      </form>
    </>
  );
}
