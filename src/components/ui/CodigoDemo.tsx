import { FlaskConical } from "lucide-react";
import { codigosDemo } from "@/lib/codigos";

/** Solo en modo de pruebas (EMAIL_MODO distinto de "smtp"): muestra el código que se habría enviado por correo */
export function CodigoDemo({ correo, tipo }: { correo: string; tipo: "registro" | "recuperacion" }) {
  if (process.env.EMAIL_MODO === "smtp") return null;
  const c = codigosDemo.get(`${tipo}:${correo.toLowerCase()}`);
  if (!c) return null;
  return (
    <div className="aviso aviso--demo mt-2" role="note">
      <FlaskConical className="i" />
      <span><b>Modo de pruebas</b>El correo no se envía de verdad. Tu código es <strong style={{ letterSpacing: ".1em" }}>{c}</strong>.</span>
    </div>
  );
}
