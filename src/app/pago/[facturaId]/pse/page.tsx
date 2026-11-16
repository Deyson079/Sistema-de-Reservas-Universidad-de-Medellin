import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { cargarFactura } from "../../comun";
import { pagarConPse } from "@/lib/acciones-portal";
import { moneda } from "@/lib/formato";
import { BotonEnviar } from "@/components/ui/Cliente";

export const metadata = { title: "Pago con PSE" };
const BANCOS = ["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA Colombia", "Banco de Occidente", "Banco Popular", "Banco AV Villas", "Scotiabank Colpatria", "Banco Caja Social", "Itaú", "Bancoomeva", "Nequi"];

export default async function Pse({ params }: { params: Promise<{ facturaId: string }> }) {
  const { facturaId } = await params;
  const { u, f } = await cargarFactura(facturaId);
  return (
    <>
      <Link href={`/pago/${f.id}/metodo`} className="miga"><ArrowLeft className="i i-sm" />Otros métodos</Link>
      <div className="pag-cab" style={{ marginTop: 0 }}><div><h1>Pago con PSE</h1><p>Te llevaremos a la página de tu banco para autorizar el débito.</p></div></div>
      <form action={pagarConPse} className="tarjeta form">
        <input type="hidden" name="facturaId" value={f.id} />
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="negrita chico" style={{ marginBottom: 8 }}>Tipo de persona</legend>
          <div className="segmento"><label><input type="radio" name="tipoPersona" value="natural" defaultChecked={u.facturacion?.tipoPersona !== "juridica"} />Persona natural</label><label><input type="radio" name="tipoPersona" value="juridica" defaultChecked={u.facturacion?.tipoPersona === "juridica"} />Persona jurídica</label></div>
        </fieldset>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="negrita chico" style={{ marginBottom: 8 }}>Banco</legend>
          <div className="bancos">{BANCOS.map((b) => <label key={b}><input type="radio" name="banco" value={b} required />{b}</label>)}</div>
        </fieldset>
        <div className="campo"><label htmlFor="correo">Correo registrado en PSE</label><input id="correo" name="correo" type="email" className="input" defaultValue={u.correo} /></div>
        <BotonEnviar className="btn btn-primario btn-lg ancho" pendiente="Conectando con tu banco…"><Landmark className="i" />Ir al banco y pagar {moneda(f.total)}</BotonEnviar>
      </form>
    </>
  );
}
