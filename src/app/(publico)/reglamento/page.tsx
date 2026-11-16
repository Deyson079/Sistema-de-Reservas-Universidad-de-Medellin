import { getConfig } from "@/lib/config";
import { LineasCancha } from "@/components/ui/Varios";
export const metadata = { title: "Reglamento de uso" };

export default async function Reglamento() {
  const c = await getConfig();
  const sec: Array<[string, string, string[]]> = [
    ["objeto", "1. Objeto", ["Este reglamento establece las condiciones de uso de las canchas polideportivas de la Universidad de Medellín reservadas a través de la plataforma Reservas Deportivas."]],
    ["usuarios", "2. Usuarios", [`Pueden reservar los miembros de la comunidad universitaria con correo ${c.dominios.map((d) => "@" + d).join(" o ")}, sin costo, y los usuarios externos, previo pago de la tarifa vigente.`, "La persona que reserva es responsable del grupo durante toda la franja."]],
    ["reservas", "3. Reservas", [`Las reservas se hacen por franjas de 1 hora, con hasta ${c.diasAnticipacion} días de anticipación y un máximo de ${c.maxFranjasDia} franjas por persona al día.`, `Las reservas de externos quedan apartadas ${c.horasParaPagar} horas mientras se paga; si no se paga en ese plazo, vencen automáticamente.`]],
    ["ingreso", "4. Ingreso al escenario", ["Para ingresar, presenta el código QR de la reserva y tu documento de identidad.", "Llega 10 minutos antes. La franja termina a la hora exacta para no afectar al siguiente grupo.", "El número de participantes no puede superar la capacidad del escenario."]],
    ["conducta", "5. Conducta y cuidado", ["Usa calzado y ropa deportiva adecuados para cada superficie.", "Está prohibido el consumo de alcohol, tabaco y sustancias psicoactivas, así como el ingreso de alimentos a las superficies de juego.", "Los daños causados al escenario serán responsabilidad de quien reserva."]],
    ["cancelaciones", "6. Cancelaciones e inasistencias", [`Puedes cancelar sin penalidad hasta ${c.horasCancelacion} horas antes de la franja.`, "Tres inasistencias en un mismo semestre pueden suspender la posibilidad de reservar por 30 días.", "Bienestar Universitario puede cancelar reservas por mantenimiento, clima o eventos institucionales, avisando al usuario."]],
  ];
  return (
    <>
      <section className="cab-interna sobre-rojo"><LineasCancha /><div className="wrap"><h1>Reglamento de uso</h1><p>Normas para que todos disfrutemos los escenarios deportivos.</p></div></section>
      <article className="legal wrap">
        <nav className="indice" aria-label="Contenido"><b>Contenido</b><ol>{sec.map(([id, t]) => <li key={id}><a href={`#${id}`}>{t.replace(/^\d+\. /, "")}</a></li>)}</ol></nav>
        {sec.map(([id, t, ps]) => <section key={id} id={id}><h2>{t}</h2>{ps.length > 1 ? <ul>{ps.map((p) => <li key={p}>{p}</li>)}</ul> : <p>{ps[0]}</p>}</section>)}
        <p className="chico texto-2 mt-4">Texto de referencia para validar con Bienestar Universitario y la Secretaría General antes de publicarlo.</p>
      </article>
    </>
  );
}
