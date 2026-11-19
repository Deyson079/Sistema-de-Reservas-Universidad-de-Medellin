import { TriangleAlert, Trash2 } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { guardarPreferencias, eliminarCuenta } from "@/lib/acciones-portal";
import { urlArchivo } from "@/lib/storage";
import { fechaLarga } from "@/lib/formato";
import { ROLES_USUARIO } from "@/lib/estados";
import { Avatar } from "@/components/ui/Avatar";
import { BadgeRol } from "@/components/ui/Chip";
import { Confirmar, CerrarDialogo, BotonEnviar, CampoPassword } from "@/components/ui/Cliente";
import { FormDatos, FormFacturacion, FormPassword, FormCorreo } from "./formularios";

export const metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

export default async function Perfil() {
  const u = await requireUsuario();
  const ext = u.tipo === "externo";
  const pref = (u.preferencias ?? {}) as { correo?: boolean; recordatorio?: boolean; promociones?: boolean };
  const rut = await urlArchivo(u.facturacion?.rutUrl);
  const Seccion = ({ id, titulo, desc, children }: { id: string; titulo: string; desc?: string; children: React.ReactNode }) => (
    <section id={id} className="tarjeta" style={{ display: "grid", gridTemplateColumns: "minmax(0,280px) minmax(0,1fr)", gap: 32, scrollMarginTop: 96 }}>
      <div><h2 className="t-h4" style={{ margin: 0 }}>{titulo}</h2>{desc && <p className="chico texto-2">{desc}</p>}</div><div>{children}</div>
    </section>
  );
  return (
    <div className="contenedor" style={{ maxWidth: 1040 }}>
      <div className="pag-cab">
        <div className="fila" style={{ gap: 18 }}><Avatar nombre={`${u.nombres} ${u.apellidos}`} tipo={u.tipo} tam="lg" /><div><h1>Mi perfil</h1><p className="fila" style={{ gap: 10 }}><BadgeRol tipo={u.tipo} texto={ext ? "Externo" : `Comunidad · ${ROLES_USUARIO[u.rol]}`} /><span>Cuenta creada el {fechaLarga(u.creadoEn, true)}</span></p></div></div>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <Seccion id="datos" titulo="Datos personales"><FormDatos u={{ ...u, comunidad: !ext }} /></Seccion>
        {ext && <Seccion id="facturacion" titulo="Datos de facturación" desc="Así aparecerán en tus facturas. El RUT es obligatorio antes del primer pago."><FormFacturacion f={u.facturacion} rut={rut} /></Seccion>}
        <Seccion id="correo" titulo="Correo" desc="El cambio se aplica al instante. Confírmalo con tu contraseña actual."><FormCorreo actual={u.correo} demo={process.env.EMAIL_MODO !== "smtp" ? "1" : undefined} /></Seccion>
        <Seccion id="contrasena" titulo="Contraseña"><FormPassword /></Seccion>
        <Seccion id="preferencias" titulo="Preferencias de notificación" desc="Los avisos de pagos y cancelaciones siempre llegan, porque afectan tu reserva.">
          <form action={guardarPreferencias} className="form">
            <label className="check"><input type="checkbox" name="correo" defaultChecked={pref.correo !== false} /><span><b>Correos de confirmación</b><br /><span className="texto-2">Reserva confirmada, pago recibido y facturas.</span></span></label>
            <label className="check"><input type="checkbox" name="recordatorio" defaultChecked={pref.recordatorio !== false} /><span><b>Recordatorio 24 horas antes</b><br /><span className="texto-2">Por correo y en Avisos.</span></span></label>
            <label className="check"><input type="checkbox" name="promociones" defaultChecked={!!pref.promociones} /><span><b>Novedades de Bienestar Universitario</b><br /><span className="texto-2">Torneos, escuelas deportivas y eventos.</span></span></label>
            <div><BotonEnviar className="btn btn-secundario">Guardar preferencias</BotonEnviar></div>
          </form>
        </Seccion>
        <Seccion id="eliminar" titulo="Eliminar cuenta" desc="Borramos tus datos personales según la Ley 1581 de 2012. Las facturas se conservan por obligación legal.">
          <div className="aviso aviso--error"><TriangleAlert className="i" /><span>Esta acción no se puede deshacer. Antes debes cancelar tus reservas activas.</span></div>
          <div className="mt-2">
            <Confirmar boton={<><Trash2 className="i" />Eliminar mi cuenta</>} titulo="¿Eliminar tu cuenta?" descripcion="Perderás tu historial de reservas. Escribe tu contraseña para confirmar." icono={<Trash2 className="i" />}>
              <form action={eliminarCuenta}><div className="cuerpo"><CampoPassword etiqueta="Contraseña" /></div><div className="acciones"><CerrarDialogo>Conservar cuenta</CerrarDialogo><BotonEnviar className="btn btn-peligro">Eliminar definitivamente</BotonEnviar></div></form>
            </Confirmar>
          </div>
        </Seccion>
      </div>
      <style>{`@media (max-width:760px){#datos,#facturacion,#correo,#contrasena,#preferencias,#eliminar{grid-template-columns:1fr!important;gap:12px!important}}`}</style>
    </div>
  );
}
