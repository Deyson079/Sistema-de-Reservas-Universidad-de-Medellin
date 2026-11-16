import { getConfig } from "@/lib/config";
import { LineasCancha } from "@/components/ui/Varios";
export const metadata = { title: "Términos y política de datos" };

export default async function Terminos() {
  const c = await getConfig();
  return (
    <>
      <section className="cab-interna sobre-rojo"><LineasCancha /><div className="wrap"><h1>Términos y datos</h1><p>Términos y condiciones de uso y política de tratamiento de datos personales (Ley 1581 de 2012).</p></div></section>
      <article className="legal wrap">
        <nav className="indice" aria-label="Contenido"><b>Contenido</b><ol><li><a href="#terminos">Términos y condiciones</a></li><li><a href="#datos">Política de tratamiento de datos personales</a></li><li><a href="#derechos">Derechos de los titulares</a></li><li><a href="#cookies">Cookies</a></li></ol></nav>
        <section id="terminos"><h2>Términos y condiciones</h2>
          <p>Al crear una cuenta en Reservas Deportivas Universidad de Medellín aceptas estos términos, el reglamento de uso de los escenarios y la política de tratamiento de datos.</p>
          <h3>Cuenta</h3><p>Eres responsable de la veracidad de tus datos y de la confidencialidad de tu contraseña. Las cuentas de comunidad requieren un correo institucional vigente.</p>
          <h3>Pagos</h3><p>Las tarifas para usuarios externos se publican en la plataforma e incluyen los impuestos que apliquen. La reserva se confirma cuando Tesorería valida el pago. Las devoluciones se tramitan según la política financiera de la Universidad.</p>
          <h3>Disponibilidad</h3><p>La Universidad puede modificar la disponibilidad de los escenarios por mantenimiento, clima o actividades institucionales, avisando oportunamente a los usuarios afectados.</p>
        </section>
        <section id="datos"><h2>Política de tratamiento de datos personales</h2>
          <p>En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, la Universidad de Medellín, NIT {c.nitUniversidad}, con domicilio en {c.contacto.direccion}, es responsable del tratamiento de los datos personales recolectados en esta plataforma.</p>
          <h3>Datos que recolectamos</h3><ul><li>Identificación: nombres, apellidos, tipo y número de documento.</li><li>Contacto: correo electrónico y celular.</li><li>Vinculación con la Universidad: rol y programa o dependencia.</li><li>Facturación (externos): razón social, NIT o cédula, dirección, ciudad y RUT.</li><li>Uso: reservas, asistencia, pagos y comprobantes.</li></ul>
          <h3>Finalidades</h3><ul><li>Gestionar cuentas, reservas, pagos y facturación.</li><li>Enviar códigos de verificación, confirmaciones, recordatorios y avisos.</li><li>Controlar el acceso a los escenarios y generar estadísticas de uso.</li><li>Atender solicitudes, quejas y reclamos.</li></ul>
        </section>
        <section id="derechos"><h2>Derechos de los titulares</h2><p>Puedes conocer, actualizar, rectificar y suprimir tus datos, revocar la autorización y presentar quejas ante la Superintendencia de Industria y Comercio. Escribe a <a href={`mailto:${c.contacto.correo}`} className="enlace-simple">{c.contacto.correo}</a>. También puedes eliminar tu cuenta desde Mi perfil.</p></section>
        <section id="cookies"><h2>Cookies</h2><p>Usamos cookies técnicas para mantener tu sesión y recordar tus preferencias. No usamos cookies publicitarias.</p></section>
        <p className="chico texto-2 mt-4">Texto de referencia para validar con la Secretaría General y la oficina jurídica de la Universidad de Medellín antes de publicarlo.</p>
      </article>
    </>
  );
}
