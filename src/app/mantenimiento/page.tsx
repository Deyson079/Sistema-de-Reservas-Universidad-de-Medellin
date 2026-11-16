import { PaginaEstado, DibujoMantenimiento } from "../components-estado";
export const metadata = { title: "Mantenimiento" };
export default function Mantenimiento() {
  return <PaginaEstado titulo="Estamos demarcando la cancha" texto="La plataforma está en mantenimiento programado hasta las 6:00 a. m. Tus reservas siguen confirmadas y no se pierde ningún dato." dibujo={<DibujoMantenimiento />} acciones={<a href="mailto:deportes@udemedellin.edu.co" className="btn btn-contorno btn-lg">Escribir a Bienestar</a>} />;
}
