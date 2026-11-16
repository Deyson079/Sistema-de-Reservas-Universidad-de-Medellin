import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getConfig } from "@/lib/config";
import { moneda } from "@/lib/formato";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crear cuenta" };

export default async function ElegirTipo() {
  const cfg = await getConfig();
  const min = (await db.cancha.aggregate({ _min: { tarifaHora: true } }))._min.tarifaHora ?? 0;
  return (
    <>
      <h1>Crea tu cuenta</h1>
      <p className="intro">Elige el tipo de cuenta. Si tienes correo de la Universidad de Medellín, usa la de comunidad: no pagarás reservas.</p>
      <div className="tipos">
        <Link href="/registro/comunidad" className="tipo tipo--com">
          <span className="badge" style={{ background: "rgba(255,255,255,.16)", alignSelf: "flex-start" }}>Con {cfg.dominios.map((d) => "@" + d).join(" o @").replace("@@", "@")}</span>
          <h2>Soy de la comunidad Universidad de Medellín</h2>
          <p>Estudiantes, docentes, administrativos y egresados.</p>
          <span className="precio-t">$0<small>sin costo</small></span>
          <span className="ir">Crear cuenta de comunidad<ArrowRight className="i" /></span>
        </Link>
        <Link href="/registro/externo" className="tipo tipo--ext">
          <span className="badge" style={{ background: "rgba(255,255,255,.16)", alignSelf: "flex-start" }}>Cualquier correo</span>
          <h2>Soy externo</h2>
          <p>Personas naturales o empresas. Pagas por hora y Tesorería valida el pago.</p>
          <span className="precio-t">{moneda(min, false)}<small>COP por hora, desde</small></span>
          <span className="ir">Crear cuenta de externo<ArrowRight className="i" /></span>
        </Link>
      </div>
      <p className="mt-3 chico texto-2">¿Ya tienes cuenta? <Link href="/ingresar" className="enlace-simple">Ingresa</Link></p>
    </>
  );
}
