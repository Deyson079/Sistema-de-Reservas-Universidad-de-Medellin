import { Mail, Phone, Clock, MapPin } from "lucide-react";
import { getConfig } from "@/lib/config";
import { LineasCancha } from "@/components/ui/Varios";
import { BuscadorFaq } from "./buscador";

export const metadata = { title: "Ayuda y preguntas frecuentes" };

export default async function Ayuda() {
  const c = await getConfig();
  const grupos = [
    { titulo: "Cuenta y registro", preguntas: [
      ["¿Qué cuenta debo crear?", `Si tienes correo ${c.dominios.map((d) => "@" + d).join(" o ")}, crea una cuenta de comunidad: no pagas y tus reservas se confirman al instante. Con cualquier otro correo, crea una cuenta de externo.`],
      ["Olvidé mi contraseña", `Escribe a ${c.contacto.correo} o llama al ${c.contacto.telefono} desde el correo o el celular de tu cuenta. Te asignamos una contraseña temporal; después cámbiala en Mi perfil.`],
      ["Bloquearon mi cuenta", "Después de 5 intentos fallidos bloqueamos la cuenta 15 minutos por seguridad. Espera e intenta de nuevo; si olvidaste la contraseña, pide una temporal."],
    ] as Array<[string, string]> },
    { titulo: "Reservas", preguntas: [
      ["¿Con cuánta anticipación puedo reservar?", `Hasta ${c.diasAnticipacion} días antes, en franjas de 1 hora, y hasta ${c.maxFranjasDia} franjas por día.`],
      ["¿Qué necesito para entrar?", "El código QR de tu reserva y tu documento de identidad. Llega 10 minutos antes."],
      ["¿Cómo cancelo?", `Desde Mis reservas, con un motivo. Si faltan más de ${c.horasCancelacion} horas, no hay penalidad.`],
      ["¿Qué pasa si no asisto?", "Bienestar Universitario registra la inasistencia. Las inasistencias repetidas pueden limitar nuevas reservas según el reglamento."],
      ["¿Pueden cancelar mi reserva?", "Sí, por mantenimiento, clima o eventos institucionales. Te avisamos por correo y en Avisos, y puedes reservar otra franja."],
    ] as Array<[string, string]> },
    { titulo: "Pagos (externos)", preguntas: [
      ["¿Cómo pago?", "Con tarjeta crédito o débito, PSE, Nequi o Daviplata, o por transferencia o consignación a la cuenta de la Universidad de Medellín, subiendo el comprobante."],
      ["¿Cuánto tiempo tengo para pagar?", `Tu horario queda apartado ${c.horasParaPagar} horas. Si no pagas en ese plazo, la reserva vence y la franja se libera.`],
      ["¿Cuándo queda confirmada mi reserva?", "Cuando Tesorería valida el pago, normalmente en menos de 1 día hábil. Te llega el código QR por correo."],
      ["¿Por qué me piden el RUT?", "Es obligatorio para emitir la factura. Puedes subirlo al registrarte o antes de tu primer pago, en PDF."],
      ["Rechazaron mi pago", "Verás el motivo en el detalle de la reserva y podrás pagar de nuevo mientras el horario siga apartado."],
    ] as Array<[string, string]> },
  ];
  return (
    <>
      <section className="cab-interna sobre-rojo"><LineasCancha /><div className="wrap"><h1>Ayuda</h1><p>Respuestas rápidas sobre cuentas, reservas y pagos.</p></div></section>
      <div className="wrap" style={{ padding: "40px 0 96px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 48 }}>
        <div><BuscadorFaq grupos={grupos} /></div>
        <aside className="tarjeta" style={{ alignSelf: "start", position: "sticky", top: 108 }} id="contacto">
          <h2 className="t-h4" style={{ margin: "0 0 4px" }}>Contacto</h2><p className="chico texto-2">Bienestar Universitario, área de Deportes.</p>
          <ul className="politicas mt-2"><li><Mail className="i" /><a href={`mailto:${c.contacto.correo}`} className="enlace-simple">{c.contacto.correo}</a></li><li><Phone className="i" />{c.contacto.telefono}</li><li><MapPin className="i" />{c.contacto.direccion}</li><li><Clock className="i" />{c.contacto.horario}</li></ul>
          <a href={`mailto:${c.contacto.correo}?subject=${encodeURIComponent("Ayuda con Reservas Deportivas")}`} className="btn btn-primario ancho mt-2"><Mail className="i" />Escribir un correo</a>
        </aside>
      </div>
      <style>{`@media (max-width:900px){#contenido .wrap[style*="340px"]{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}
