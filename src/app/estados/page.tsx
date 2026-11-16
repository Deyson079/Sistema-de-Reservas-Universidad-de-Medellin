import Link from "next/link";
import { CircleCheck, X, Info } from "lucide-react";
import { Vacio } from "@/components/ui/Varios";
export const metadata = { title: "Estados del sistema" };
/** Catálogo de estados para revisión de diseño (10 Estados del sistema) */
export default function Estados() {
  return (
    <div className="contenedor" style={{ padding: "32px 0 80px" }}>
      <div className="pag-cab"><div><h1>Estados del sistema</h1><p>Páginas de error, vacíos, cargas, toasts, confirmaciones y banner de cookies.</p></div></div>
      <div className="grid-4">{[["/no-existe", "Página 404"], ["/estados/error", "Error 500"], ["/mantenimiento", "Mantenimiento"], ["/sin-conexion", "Sin conexión"]].map(([h, t]) => <Link key={h} href={h} className="acceso"><b>{t}</b><span>Abrir pantalla</span></Link>)}</div>
      <h2 className="t-h3 mt-6">Vacíos</h2>
      <div className="grid-3 mt-2"><Vacio titulo="Aún no tienes reservas" texto="Elige un escenario y una hora libre." accion={<Link href="/portal/reservar" className="btn btn-primario">Reservar</Link>} /><Vacio titulo="Estás al día" texto="No hay pagos esperando validación." /><Vacio titulo="Sin resultados" texto="Prueba con otros filtros." /></div>
      <h2 className="t-h3 mt-6">Cargando</h2>
      <div className="tarjeta mt-2">{[0, 1].map((i) => <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", marginTop: i ? 20 : 0 }}><div className="sk" style={{ width: 120, height: 84, borderRadius: 12 }} /><div style={{ flex: 1 }}><div className="sk" style={{ height: 20, width: "55%" }} /><div className="sk" style={{ height: 14, width: "35%", marginTop: 10 }} /><div className="sk" style={{ height: 28, width: 110, marginTop: 12, borderRadius: 14 }} /></div></div>)}</div>
      <h2 className="t-h3 mt-6">Toasts</h2>
      <div className="toasts mt-2">
        <div className="toast"><span className="ic" style={{ background: "var(--exito)" }}><CircleCheck className="i i-sm" /></span><div><b>Reserva confirmada</b><span>Coliseo cubierto, martes 17 de noviembre, 6:00 p. m.</span></div></div>
        <div className="toast"><span className="ic" style={{ background: "var(--error)" }}><X className="i i-sm" /></span><div><b>Alguien tomó esa franja</b><span>Elige otra hora; te sugerimos opciones cercanas.</span></div></div>
        <div className="toast"><span className="ic" style={{ background: "var(--info)" }}><Info className="i i-sm" /></span><div><b>Comprobante enviado</b><span>Tesorería lo revisará en menos de 1 día hábil.</span></div></div>
      </div>
      <p className="mt-4 chico texto-2">El banner de cookies aparece la primera vez que se visita el sitio. Para verlo de nuevo, borra el almacenamiento del navegador.</p>
    </div>
  );
}
