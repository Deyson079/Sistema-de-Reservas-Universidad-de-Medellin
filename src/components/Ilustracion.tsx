import { svgCancha } from "./canchas-svg";

/** Ilustración de cancha en perspectiva; el contenedor define tamaño y recorte */
export function Ilustracion({ tipo, className = "ilus", style }: { tipo: string; className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: svgCancha(tipo) }} />;
}
