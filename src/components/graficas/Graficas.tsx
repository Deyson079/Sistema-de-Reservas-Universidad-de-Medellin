// Gráficas en SVG/HTML: tooltip al pasar el cursor o con el foco, y vista de tabla
import { moneda } from "@/lib/formato";

export function TablaDatos({ titulo, filas, columnas }: { titulo: string; filas: Array<Array<string | number>>; columnas: string[] }) {
  return (
    <details className="tabla-datos"><summary>Ver como tabla</summary>
      <table className="t" aria-label={titulo}><thead><tr>{columnas.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{filas.map((f, i) => <tr key={i}>{f.map((v, j) => <td key={j} className={j ? "num" : ""}>{v}</td>)}</tr>)}</tbody></table>
    </details>
  );
}

/** Línea de área (recaudo de 30 días) */
export function LineaArea({ datos, formato = (n: number) => moneda(n, false), color = "var(--rojo-600)" }: { datos: Array<{ etiqueta: string; corta: string; valor: number }>; formato?: (n: number) => string; color?: string }) {
  const W = 720, H = 220, P = { l: 56, r: 12, t: 16, b: 28 };
  const max = Math.max(1, ...datos.map((d) => d.valor)) * 1.15;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, datos.length - 1);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const linea = datos.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.valor)}`).join(" ");
  const area = `${linea} L${x(datos.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const paso = Math.ceil(datos.length / 6);
  return (
    <svg className="linea-graf graf-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de línea">
      <defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#C2262B" stopOpacity=".22" /><stop offset="1" stopColor="#C2262B" stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t, i) => <g key={i}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#E1E4E6" strokeDasharray={i ? "3 4" : undefined} /><text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#69737C">{t >= 1e6 ? `${(t / 1e6).toFixed(1).replace(".", ",")} M` : t >= 1e3 ? `${Math.round(t / 1e3)} mil` : Math.round(t)}</text></g>)}
      <path d={area} fill="url(#ga)" />
      <path d={linea} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {datos.map((d, i) => (
        <g key={i} className="p" tabIndex={0} aria-label={`${d.etiqueta}: ${formato(d.valor)}`}>
          <rect className="hit" x={x(i) - (W - P.l) / datos.length / 2} y={P.t} width={(W - P.l) / datos.length} height={H - P.t - P.b} fill="transparent"><title>{`${d.etiqueta}\n${formato(d.valor)}`}</title></rect>
          <circle className="pto" cx={x(i)} cy={y(d.valor)} r="5" fill="#fff" stroke={color} strokeWidth="2.5" />
          {i % paso === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#69737C">{d.corta}</text>}
        </g>
      ))}
    </svg>
  );
}

/** Barras verticales de una serie */
export function Barras({ datos, max: maxP, color = "var(--rojo-600)" }: { datos: Array<{ etiqueta: string; corta: string; valor: number; tip?: string; apagada?: boolean }>; max?: number; color?: string }) {
  const max = maxP ?? Math.max(1, ...datos.map((d) => d.valor)) * 1.1;
  return (
    <>
      <div className="barras" style={{ gridTemplateColumns: `repeat(${datos.length},1fr)`, gap: datos.length > 20 ? 3 : 6 }}>
        {datos.map((d, i) => (
          <div key={i} className={`b ${d.apagada ? "dom" : ""}`} tabIndex={0} aria-label={`${d.etiqueta}: ${d.tip ?? d.valor}`} data-tip={`${d.etiqueta}\n${d.tip ?? d.valor}`}><i style={{ height: `${Math.max((d.valor / max) * 100, 1.5)}%`, background: d.apagada ? undefined : color }} /></div>
        ))}
      </div>
      <div className="ejes" style={{ gridTemplateColumns: `repeat(${datos.length},1fr)`, gap: datos.length > 20 ? 3 : 6 }}>{datos.map((d, i) => <span key={i}>{datos.length > 16 ? (i % 3 === 0 ? d.corta : "") : d.corta}</span>)}</div>
    </>
  );
}

const RAMPA = ["#E6EEF6", "#BBD0E4", "#86AACE", "#4F7FB0", "#2B5885", "#1C3A5A"];
export function MapaCalor({ filas, columnas, valores }: { filas: string[]; columnas: string[]; valores: number[][] }) {
  return (
    <>
      <div className="calor" style={{ gridTemplateColumns: `52px repeat(${columnas.length},1fr)` }}>
        <span />{columnas.map((c) => <span key={c} className="hd">{c}</span>)}
        {filas.map((f, r) => (
          <span key={f} style={{ display: "contents" }}>
            <span className="lab">{f}</span>
            {columnas.map((c, ci) => { const v = valores[r]?.[ci] ?? 0; return <span key={c} className="c" tabIndex={0} style={{ background: RAMPA[Math.min(5, Math.floor(v / 17))] }} data-tip={`${c}, ${f}\n${v} % ocupado`} aria-label={`${c} ${f}: ${v} % ocupado`} />; })}
          </span>
        ))}
      </div>
      <div className="escala"><span>Menos</span>{RAMPA.map((c) => <i key={c} style={{ background: c }} />)}<span>Más</span></div>
    </>
  );
}

export function BarrasH({ items, formato = (n: number) => String(n), color = "var(--rojo-600)" }: { items: Array<{ etiqueta: string; valor: number; color?: string }>; formato?: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <div className="barras-h">
      {items.map((i) => <div key={i.etiqueta} className="f"><span>{i.etiqueta}</span><span className="pista" data-tip={`${i.etiqueta}: ${formato(i.valor)}`}><i style={{ width: `${(i.valor / max) * 100}%`, background: i.color ?? color }} /></span><span className="v">{formato(i.valor)}</span></div>)}
    </div>
  );
}

export function Division({ a, b }: { a: { etiqueta: string; valor: number; color: string }; b: { etiqueta: string; valor: number; color: string } }) {
  const t = a.valor + b.valor || 1;
  const pa = Math.round((a.valor / t) * 100);
  return (
    <>
      <div className="split">{[{ ...a, p: pa }, { ...b, p: 100 - pa }].filter((x) => x.p > 0).map((x) => <div key={x.etiqueta} style={{ flex: x.p, background: x.color }} data-tip={`${x.etiqueta}: ${x.valor}`}>{x.p} %</div>)}</div>
      <div className="leyenda"><span><i style={{ background: a.color }} />{a.etiqueta} · {a.valor}</span><span><i style={{ background: b.color }} />{b.etiqueta} · {b.valor}</span></div>
    </>
  );
}
