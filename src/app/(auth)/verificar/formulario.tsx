"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleX, TimerOff, Check } from "lucide-react";
import { verificarRegistro, reenviarCodigo, cambiarCorreoRegistro, type Estado } from "@/lib/acciones-auth";
import { BotonEnviar, BotonEspera, CodigoSeis, Temporizador } from "@/components/ui/Cliente";

export function FormVerificar({ correo, expira, espera, tipoCodigo = "registro", accion: accionProp }: { correo: string; expira?: string; espera: number; tipoCodigo?: "registro" | "recuperacion"; accion?: (s: Estado, f: FormData) => Promise<Estado> }) {
  const [e, accion] = useActionState<Estado, FormData>(accionProp ?? verificarRegistro, undefined);
  const [er, reenviar] = useActionState<Estado, FormData>(reenviarCodigo, undefined);
  const [ec, cambiar] = useActionState<Estado, FormData>(cambiarCorreoRegistro, undefined);
  const router = useRouter();
  useEffect(() => { if (e?.ok && e.redir) { const t = setTimeout(() => router.push(e.redir!), 1600); return () => clearTimeout(t); } }, [e, router]);
  const vencido = e?.tipo === "vencido" || (expira ? new Date(expira) < new Date() : false);

  if (e?.ok) return (
    <div className="exito-anim" role="status">
      <span className="circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <h2 className="t-h2" style={{ marginTop: 28 }}>Correo verificado</h2>
      <p className="texto-2">Tu cuenta está activa. Te llevamos a tu portal…</p>
    </div>
  );
  return (
    <>
      <form action={accion} className="form">
        <input type="hidden" name="correo" value={correo} />
        <CodigoSeis estado={e?.tipo === "incorrecto" ? "error" : undefined} />
        <div aria-live="polite">
          {e?.error && <div className={`aviso ${e.tipo === "vencido" ? "aviso--alerta" : "aviso--error"}`}>{e.tipo === "vencido" ? <TimerOff className="i" /> : <CircleX className="i" />}<span>{e.error}</span></div>}
          {er?.error && <div className="aviso aviso--alerta mt-1"><TimerOff className="i" /><span>{er.error}</span></div>}
        </div>
        {expira && !vencido && <Temporizador hasta={expira} />}
        {vencido && <span className="reloj vence"><b>00:00</b> El código venció.</span>}
        <BotonEnviar className="btn btn-primario btn-lg ancho"><Check className="i" />Verificar</BotonEnviar>
      </form>
      <form action={reenviar} className="fila mt-2" style={{ justifyContent: "space-between" }}>
        <input type="hidden" name="correo" value={correo} /><input type="hidden" name="tipoCodigo" value={tipoCodigo} />
        <span className="chico texto-2">¿No te llegó? Revisa también la carpeta de spam.</span>
        <BotonEspera segundos={er?.espera ?? espera}>Reenviar código</BotonEspera>
      </form>
      {tipoCodigo === "registro" && (
        <details className="mt-2">
          <summary className="enlace-simple" style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Cambiar correo</summary>
          <form action={cambiar} className="form mt-1">
            <input type="hidden" name="correo" value={correo} />
            <div className="campo"><label htmlFor="nuevo">Correo correcto</label><input id="nuevo" name="nuevo" type="email" className="input" required autoComplete="email" /></div>
            {ec?.error && <div className="aviso aviso--error"><CircleX className="i" /><span>{ec.error}</span></div>}
            <BotonEnviar className="btn btn-secundario">Enviar código al nuevo correo</BotonEnviar>
          </form>
        </details>
      )}
    </>
  );
}
