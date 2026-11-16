import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-marca sobre-rojo" aria-hidden>
        <svg className="lineas" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="2"><line x1="0" y1="450" x2="600" y2="450" /><circle cx="300" cy="450" r="110" /><circle cx="300" cy="450" r="5" fill="#fff" fillOpacity=".16" /><rect x="160" y="-2" width="280" height="140" /><rect x="230" y="-2" width="140" height="60" /><path d="M240 138 A70 70 0 0 0 360 138" /><rect x="160" y="762" width="280" height="140" /></svg>
        <img className="logo" src="/brand/logo-blanco.png" alt="" />
        <p className="frase">Tu cancha, reservada en tres pasos.</p>
        <p className="sub">Canchas polideportivas de la Universidad de Medellín, por franjas de 1 hora.</p>
      </aside>
      <main className="auth-forma" id="contenido">
        <div className="arriba">
          <Link href="/" className="miga"><ArrowLeft className="i i-sm" />Volver al inicio</Link>
          <img className="auth-logo-movil" src="/brand/logo-color.png" alt="Universidad de Medellín" />
        </div>
        <div className="cuerpo">{children}</div>
      </main>
    </div>
  );
}
