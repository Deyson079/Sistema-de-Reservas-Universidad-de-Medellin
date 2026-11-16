import { iniciales } from "@/lib/formato";
export function Avatar({ nombre, tipo, tam = "" }: { nombre: string; tipo: "comunidad" | "externo" | "personal"; tam?: "" | "sm" | "lg" }) {
  const c = tipo === "comunidad" ? "av--com" : tipo === "externo" ? "av--ext" : "av--per anillo";
  return <span className={`av ${c} ${tam ? "av-" + tam : ""}`} aria-hidden>{iniciales(nombre)}</span>;
}
