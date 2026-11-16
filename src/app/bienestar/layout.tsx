import { requirePersonal } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffShell } from "@/components/staff/Shell";

export const metadata = { title: "Bienestar Universitario" };

export default async function LayoutBienestar({ children }: { children: React.ReactNode }) {
  const p = await requirePersonal(["bienestar"]);
  const fuera = await db.cancha.count({ where: { estado: "fuera_de_servicio" } });
  return (
    <StaffShell p={p} rol="bienestar" items={[
      { href: "/bienestar", texto: "Inicio", icono: "ChartColumn" },
      { href: "/bienestar/calendario", texto: "Calendario", icono: "CalendarDays" },
      { href: "/bienestar/reservas", texto: "Reservas", icono: "List" },
      { href: "/bienestar/canchas", texto: "Canchas", icono: "MapPin", cuenta: fuera },
      { href: "/bienestar/reportes", texto: "Reportes", icono: "Download" },
    ]}>{children}</StaffShell>
  );
}
