import Link from "next/link";
export const metadata = { title: "Contraseña actualizada" };
export default function Listo() {
  return (
    <div className="exito-anim" style={{ placeItems: "start", textAlign: "left" }}>
      <span className="circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <h1 style={{ marginTop: 32 }}>Contraseña actualizada</h1>
      <p className="intro">Ya puedes ingresar con tu nueva contraseña. Por seguridad, cerramos las demás sesiones.</p>
      <Link href="/ingresar" className="btn btn-primario btn-lg">Ingresar</Link>
    </div>
  );
}
