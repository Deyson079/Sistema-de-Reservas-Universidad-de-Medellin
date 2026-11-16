import Link from "next/link";
import { PaginaEstado, DibujoFuera } from "./components-estado";
export default function NoEncontrada() {
  return <PaginaEstado codigo="404" titulo="Balón fuera de la cancha" texto="No encontramos la página que buscas. Puede que el enlace esté mal escrito o que la página ya no exista." dibujo={<DibujoFuera />} acciones={<><Link href="/" className="btn btn-primario btn-lg">Ir al inicio</Link><Link href="/escenarios" className="btn btn-contorno btn-lg">Ver escenarios</Link></>} />;
}
