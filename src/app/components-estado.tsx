import Link from "next/link";

export function PaginaEstado({ codigo, titulo, texto, acciones, dibujo }: { codigo?: string; titulo: string; texto: string; acciones: React.ReactNode; dibujo: React.ReactNode }) {
  return (
    <main className="estado-pag" id="contenido">
      <div className="izq">
        <Link href="/"><img src="/brand/logo-color.png" alt="Universidad de Medellín, ir al inicio" /></Link>
        <div className="cuerpo">{codigo && <div className="codigo">{codigo}</div>}<h1>{titulo}</h1><p>{texto}</p><div className="fila">{acciones}</div></div>
      </div>
      <div className="der oscuro" aria-hidden>{dibujo}</div>
    </main>
  );
}

const L = "rgba(255,255,255,.22)";
export const DibujoFuera = () => (
  <svg className="dib" viewBox="0 0 520 360" fill="none"><rect x="10" y="10" width="500" height="340" stroke={L} strokeWidth="2" /><line x1="260" y1="10" x2="260" y2="350" stroke={L} strokeWidth="2" /><circle cx="260" cy="180" r="60" stroke={L} strokeWidth="2" /><rect x="10" y="100" width="70" height="160" stroke={L} strokeWidth="2" /><rect x="440" y="100" width="70" height="160" stroke={L} strokeWidth="2" />
    <circle cx="560" cy="70" r="28" fill="#F3D941" transform="translate(-90 0)" /><path d="M445 70 q 20 -60 60 -40" stroke="#F3D941" strokeWidth="2" strokeDasharray="6 8" /><ellipse cx="470" cy="330" rx="26" ry="5" fill="#000" opacity=".3" /></svg>
);
export const DibujoTarjeta = () => (
  <svg className="dib" viewBox="0 0 520 360" fill="none"><rect x="10" y="10" width="500" height="340" stroke={L} strokeWidth="2" /><line x1="260" y1="10" x2="260" y2="350" stroke={L} strokeWidth="2" /><circle cx="260" cy="180" r="60" stroke={L} strokeWidth="2" /><rect x="225" y="120" width="70" height="100" rx="8" fill="#C2262B" transform="rotate(12 260 170)" /><text x="260" y="186" textAnchor="middle" fill="#fff" fontFamily="Barlow Condensed" fontWeight="800" fontSize="44" transform="rotate(12 260 170)">!</text></svg>
);
export const DibujoMantenimiento = () => (
  <svg className="dib" viewBox="0 0 520 360" fill="none"><rect x="10" y="10" width="500" height="340" stroke={L} strokeWidth="2" /><line x1="260" y1="10" x2="260" y2="350" stroke={L} strokeWidth="2" /><circle cx="260" cy="180" r="60" stroke={L} strokeWidth="2" />{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={70 + i * 80} y="250" width="60" height="18" fill={i % 2 ? "#16222F" : "#F3D941"} stroke="#F3D941" strokeWidth="2" />)}<path d="M120 268 v50 M440 268 v50" stroke="#F3D941" strokeWidth="4" /><path d="M236 156 l48 48 M284 156 l-48 48" stroke="#F3D941" strokeWidth="6" strokeLinecap="round" /></svg>
);
export const DibujoSinConexion = () => (
  <svg className="dib" viewBox="0 0 520 360" fill="none"><rect x="10" y="10" width="500" height="340" stroke={L} strokeWidth="2" /><line x1="260" y1="10" x2="260" y2="350" stroke={L} strokeWidth="2" strokeDasharray="10 12" /><circle cx="260" cy="180" r="60" stroke={L} strokeWidth="2" strokeDasharray="10 12" /><path d="M200 150 q60 -50 120 0 M220 175 q40 -32 80 0" stroke="#F3D941" strokeWidth="6" strokeLinecap="round" /><circle cx="260" cy="205" r="7" fill="#F3D941" /><path d="M190 120 L330 250" stroke="#C2262B" strokeWidth="7" strokeLinecap="round" /></svg>
);
