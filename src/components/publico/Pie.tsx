import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Lock, ShieldCheck } from "lucide-react";
import type { Config } from "@/lib/config";

export function Pie({ cfg }: { cfg: Config }) {
  return (
    <footer className="pie-pag oscuro">
      <div className="wrap">
        <div className="cols">
          <div>
            <img src="/brand/logo-blanco.png" alt="Universidad de Medellín, Ciencia y Libertad" />
            <div className="dato"><MapPin className="i" /><span>{cfg.contacto.direccion}</span></div>
            <div className="dato"><Phone className="i" /><span>{cfg.contacto.telefono}</span></div>
            <div className="dato"><Mail className="i" /><span>{cfg.contacto.correo}</span></div>
            <div className="dato"><Clock className="i" /><span>Escenarios: {cfg.contacto.horario}</span></div>
          </div>
          <div><h4>Plataforma</h4><ul><li><Link href="/escenarios">Escenarios</Link></li><li><Link href="/#como-funciona">Cómo funciona</Link></li><li><Link href="/#tarifas">Tarifas</Link></li><li><Link href="/ayuda">Ayuda y preguntas frecuentes</Link></li></ul></div>
          <div><h4>Legal</h4><ul><li><Link href="/reglamento">Reglamento de uso</Link></li><li><Link href="/terminos">Términos y condiciones</Link></li><li><Link href="/terminos#datos">Política de tratamiento de datos (Ley 1581 de 2012)</Link></li></ul></div>
          <div><h4>Personal</h4><Link className="btn-personal" href="/personal"><Lock className="i i-sm" />Acceso del personal</Link><p className="nota-p">Para Tesorería, Bienestar Universitario y administradores.</p></div>
        </div>
        <div className="base">
          <span>© {new Date().getFullYear()} Universidad de Medellín. Bienestar Universitario, área de Deportes.</span>
          <span className="vigilada"><span className="sello"><ShieldCheck className="i i-sm" /></span><span>Vigilada MinEducación<small>Institución de educación superior</small></span></span>
        </div>
      </div>
    </footer>
  );
}
