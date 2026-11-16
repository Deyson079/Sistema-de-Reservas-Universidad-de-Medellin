"use client";
import { PaginaEstado, DibujoSinConexion } from "../components-estado";
export default function SinConexion() {
  return <PaginaEstado titulo="Sin conexión" texto="Parece que no tienes internet. Revisa tu wifi o tus datos móviles. Tus reservas están guardadas y tu código QR sigue siendo válido." dibujo={<DibujoSinConexion />} acciones={<button className="btn btn-primario btn-lg" onClick={() => location.reload()}>Reintentar</button>} />;
}
