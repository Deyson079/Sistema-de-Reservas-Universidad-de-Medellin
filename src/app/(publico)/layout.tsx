import { Cabecera } from "@/components/publico/Cabecera";
import { Pie } from "@/components/publico/Pie";
import { getConfig } from "@/lib/config";
import { getSesion } from "@/lib/auth";

export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const [cfg, s] = await Promise.all([getConfig(), getSesion()]);
  const portal = s ? { href: s.k === "u" ? "/portal" : s.rol === "tesoreria" ? "/tesoreria" : s.rol === "bienestar" ? "/bienestar" : "/admin", nombre: s.nombre } : null;
  return (
    <>
      <Cabecera portal={portal} />
      <main id="contenido">{children}</main>
      <Pie cfg={cfg} />
    </>
  );
}
