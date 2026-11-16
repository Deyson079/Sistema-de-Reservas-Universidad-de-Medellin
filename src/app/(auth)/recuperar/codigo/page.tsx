import { redirect } from "next/navigation";
import { codigoVigente, puedeReenviar } from "@/lib/codigos";
import { recuperarPaso2 } from "@/lib/acciones-auth";
import { CodigoDemo } from "@/components/ui/CodigoDemo";
import { FormVerificar } from "../../verificar/formulario";

export const metadata = { title: "Código de recuperación" };

export default async function CodigoRecuperacion({ searchParams }: { searchParams: Promise<{ correo?: string; reenviado?: string }> }) {
  const { correo, reenviado } = await searchParams;
  if (!correo) redirect("/recuperar");
  const [c, p] = await Promise.all([codigoVigente(correo, "recuperacion"), puedeReenviar(correo, "recuperacion")]);
  return (
    <>
      <div className="pasos-mini" aria-label="Paso 2 de 3"><i className="on" /><i className="on" /><i /></div>
      <h1>Escribe el código</h1>
      <p className="intro">Si <b style={{ color: "var(--tinta)" }}>{correo}</b> tiene una cuenta, le enviamos un código de 6 dígitos.</p>
      {reenviado && <div className="aviso aviso--info" style={{ marginBottom: 16 }}>Te enviamos un código nuevo.</div>}
      <CodigoDemo correo={correo} tipo="recuperacion" />
      <div className="mt-2"><FormVerificar correo={correo} expira={c?.expiraEn.toISOString()} espera={p.espera} tipoCodigo="recuperacion" accion={recuperarPaso2} /></div>
    </>
  );
}
