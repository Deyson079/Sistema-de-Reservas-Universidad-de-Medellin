import Link from "next/link";
import { PaginaEstado, DibujoTarjeta } from "../../components-estado";
export default function Error500() {
  return <PaginaEstado codigo="500" titulo="Tarjeta roja para el servidor" texto="Algo falló de nuestro lado y no pudimos completar tu solicitud. Intenta de nuevo en unos segundos." dibujo={<DibujoTarjeta />} acciones={<><Link href="/" className="btn btn-primario btn-lg">Intentar de nuevo</Link><Link href="/" className="btn btn-contorno btn-lg">Ir al inicio</Link></>} />;
}
