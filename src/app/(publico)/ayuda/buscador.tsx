"use client";
import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";

export function BuscadorFaq({ grupos }: { grupos: Array<{ titulo: string; preguntas: Array<[string, string]> }> }) {
  const [q, setQ] = useState("");
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const filtrados = useMemo(() => grupos.map((g) => ({ ...g, preguntas: g.preguntas.filter(([p, r]) => norm(p + " " + r).includes(norm(q))) })).filter((g) => g.preguntas.length), [q, grupos]);
  const total = filtrados.reduce((a, g) => a + g.preguntas.length, 0);
  return (
    <>
      <div className="busqueda" style={{ maxWidth: 620 }}><Search className="i" /><input className="input" style={{ height: 56, fontSize: 17 }} placeholder="Busca: pagar, cancelar, QR, RUT…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en las preguntas frecuentes" /></div>
      <p className="chico texto-2" aria-live="polite">{q ? `${total} resultados para «${q}»` : `${total} preguntas`}</p>
      {filtrados.map((g) => (
        <section key={g.titulo} className="mt-4"><h2 className="t-h3" style={{ marginBottom: 8 }}>{g.titulo}</h2>
          <div className="acordeon">{g.preguntas.map(([p, r]) => <details key={p} open={!!q}><summary>{p}<span className="mas"><Plus className="i" /></span></summary><div className="resp">{r}</div></details>)}</div>
        </section>
      ))}
      {!total && <div className="vacio mt-3"><h4>Sin resultados</h4><p>Prueba con otras palabras o escríbenos.</p></div>}
    </>
  );
}
