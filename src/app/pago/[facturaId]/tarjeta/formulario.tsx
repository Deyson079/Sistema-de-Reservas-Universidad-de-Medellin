"use client";
import { useActionState, useState } from "react";
import { Lock, ShieldCheck, Info } from "lucide-react";
import { pagarConTarjeta } from "@/lib/acciones-portal";
import type { Estado } from "@/lib/acciones-auth";
import { BotonEnviar } from "@/components/ui/Cliente";

const marca = (n: string) => (/^4/.test(n) ? "VISA" : /^5[1-5]|^2[2-7]/.test(n) ? "Mastercard" : /^3[47]/.test(n) ? "AMEX" : "");

export function FormTarjeta({ facturaId, total, demo }: { facturaId: string; total: string; demo: boolean }) {
  const [e, a] = useActionState<Estado, FormData>(pagarConTarjeta, undefined);
  const [num, setNum] = useState(""), [tit, setTit] = useState(""), [ven, setVen] = useState(""), [cvv, setCvv] = useState("");
  const [atras, setAtras] = useState(false);
  const c = e?.campos ?? {};
  const visible = (num.replace(/\D/g, "") + "•".repeat(16)).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  return (
    <>
      <div className={`tarjeta-vista ${atras ? "volteada" : ""}`} aria-hidden>
        <div className="tv-int">
          <div className="tv-cara"><span className="tv-marca">{marca(num) || "Universidad de Medellín"}</span><span className="tv-chip" /><span className="tv-num">{visible}</span><div className="tv-pie"><span>Titular<b>{tit || "NOMBRE APELLIDO"}</b></span><span>Vence<b>{ven || "MM/AA"}</b></span></div></div>
          <div className="tv-cara tv-atras"><div className="tv-banda" /><div className="tv-cvv">{cvv.replace(/./g, "•") || "CVV"}</div></div>
        </div>
      </div>
      <form action={a} className="form">
        <input type="hidden" name="facturaId" value={facturaId} />
        {demo && <div className="aviso aviso--demo"><Info className="i" /><span><b>Pasarela de prueba</b>Usa 4242 4242 4242 4242 para aprobar o 4000 0000 0000 0002 para simular un rechazo.</span></div>}
        <div className={`campo ${c.numero ? "is-error" : ""}`}><label htmlFor="numero">Número de la tarjeta</label><input id="numero" name="numero" className="input" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={num} onChange={(x) => setNum(x.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())} onFocus={() => setAtras(false)} required />{c.numero && <span className="campo-ayuda">{c.numero}</span>}</div>
        <div className={`campo ${c.titular ? "is-error" : ""}`}><label htmlFor="titular">Nombre como aparece en la tarjeta</label><input id="titular" name="titular" className="input" autoComplete="cc-name" value={tit} onChange={(x) => setTit(x.target.value.toUpperCase())} onFocus={() => setAtras(false)} required />{c.titular && <span className="campo-ayuda">{c.titular}</span>}</div>
        <div className="form-grid">
          <div className={`campo ${c.vence ? "is-error" : ""}`}><label htmlFor="vence">Vence</label><input id="vence" name="vence" className="input" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={ven} onChange={(x) => { const d = x.target.value.replace(/\D/g, "").slice(0, 4); setVen(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} onFocus={() => setAtras(false)} required />{c.vence && <span className="campo-ayuda">{c.vence}</span>}</div>
          <div className={`campo ${c.cvv ? "is-error" : ""}`}><label htmlFor="cvv">Código de seguridad (CVV)</label><input id="cvv" name="cvv" className="input" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={cvv} onChange={(x) => setCvv(x.target.value.replace(/\D/g, "").slice(0, 4))} onFocus={() => setAtras(true)} onBlur={() => setAtras(false)} required />{c.cvv && <span className="campo-ayuda">{c.cvv}</span>}</div>
          <div className="campo"><label htmlFor="cuotas">Cuotas</label><select id="cuotas" name="cuotas" className="input">{[1, 2, 3, 6, 12].map((n) => <option key={n} value={n}>{n} {n === 1 ? "cuota" : "cuotas"}</option>)}</select></div>
          <div className="campo"><label htmlFor="doc">Documento del titular</label><input id="doc" name="doc" className="input" inputMode="numeric" /></div>
        </div>
        <BotonEnviar className="btn btn-primario btn-lg ancho" pendiente="Procesando…"><Lock className="i" />Pagar {total}</BotonEnviar>
        <div className="fila" style={{ justifyContent: "center", gap: 18 }}>
          <span className="seguro"><ShieldCheck className="i i-sm" />Conexión cifrada · No guardamos los datos de tu tarjeta</span>
          <span className="franquicias"><i style={{ color: "#1A1F71" }}>VISA</i><i style={{ color: "#EB001B" }}>MASTERCARD</i><i style={{ color: "#2E77BC" }}>AMEX</i><i>DINERS</i></span>
        </div>
      </form>
    </>
  );
}
