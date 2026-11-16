"use client";
import Link from "next/link";
import { PaginaEstado, DibujoTarjeta } from "./components-estado";
export default function ErrorGeneral({ reset, error }: { reset: () => void; error: Error & { digest?: string } }) {
  return <PaginaEstado codigo="500" titulo="Tarjeta roja para el servidor" texto={`Algo falló de nuestro lado y no pudimos completar tu solicitud. Intenta de nuevo en unos segundos.${error.digest ? ` Código de soporte: ${error.digest}.` : ""}`} dibujo={<DibujoTarjeta />} acciones={<><button onClick={reset} className="btn btn-primario btn-lg">Intentar de nuevo</button><Link href="/" className="btn btn-contorno btn-lg">Ir al inicio</Link></>} />;
}
