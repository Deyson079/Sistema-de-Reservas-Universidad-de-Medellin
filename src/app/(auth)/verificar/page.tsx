import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { codigoVigente, puedeReenviar } from "@/lib/codigos";
import { CodigoDemo } from "@/components/ui/CodigoDemo";
import { FormVerificar } from "./formulario";

export const metadata = { title: "Revisa tu correo" };

export default async function Verificar({ searchParams }: { searchParams: Promise<{ correo?: string; reenviado?: string }> }) {
  const { correo, reenviado } = await searchParams;
  if (!correo) redirect("/registro");
  const [c, p] = await Promise.all([codigoVigente(correo, "registro"), puedeReenviar(correo, "registro")]);
  return (
    <>
      <span className="av av-lg" style={{ background: "var(--rojo-50)", color: "var(--rojo-600)", marginBottom: 18 }}><MailCheck className="i i-lg" /></span>
      <h1>Revisa tu correo</h1>
      <p className="intro">Enviamos un código de 6 dígitos a <b style={{ color: "var(--tinta)" }}>{correo}</b>. Escríbelo o pégalo aquí.</p>
      {reenviado && <div className="aviso aviso--info" style={{ marginBottom: 16 }}>Te enviamos un código nuevo. El anterior ya no sirve.</div>}
      <CodigoDemo correo={correo} tipo="registro" />
      <div className="mt-2"><FormVerificar correo={correo} expira={c?.expiraEn.toISOString()} espera={p.espera} /></div>
    </>
  );
}
