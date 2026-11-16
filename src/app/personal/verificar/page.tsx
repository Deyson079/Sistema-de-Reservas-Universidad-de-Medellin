import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { leer } from "@/lib/sesion-token";
import { db } from "@/lib/db";
import { codigoVigente } from "@/lib/codigos";
import { CodigoDemo } from "@/components/ui/CodigoDemo";
import { FormDosPasos } from "./formulario";

export default async function VerificarPersonal() {
  const t = await leer((await cookies()).get("udem_2fa")?.value);
  if (!t) redirect("/personal");
  const p = await db.personal.findUnique({ where: { id: t.sub } });
  if (!p) redirect("/personal");
  const c = await codigoVigente(p.correo, "doble_factor");
  const oculto = p.correo.replace(/^(.{2}).*(@.*)$/, "$1•••$2");
  return (
    <div className="staff-card">
      <div className="cab"><img src="/brand/escudo.png" alt="" /><div><h1>Verificación en dos pasos</h1><p>Hola, {p.nombre.split(" ")[0]}</p></div></div>
      <p className="chico texto-2" style={{ marginTop: 0 }}>Enviamos un código de 6 dígitos a <b style={{ color: "var(--tinta)" }}>{oculto}</b>.</p>
      <CodigoDemo correo={p.correo} tipo="doble_factor" />
      <div className="mt-2"><FormDosPasos expira={c?.expiraEn.toISOString()} /></div>
    </div>
  );
}
