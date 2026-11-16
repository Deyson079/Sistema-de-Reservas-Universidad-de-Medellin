import { requirePersonal } from "@/lib/auth";
import { db } from "@/lib/db";
import { StaffShell } from "@/components/staff/Shell";

export const metadata = { title: "Tesorería" };

export default async function LayoutTesoreria({ children }: { children: React.ReactNode }) {
  const p = await requirePersonal(["tesoreria"]);
  const porValidar = await db.pago.count({ where: { estado: "en_validacion" } });
  return (
    <StaffShell p={p} rol="tesoreria" items={[
      { href: "/tesoreria", texto: "Inicio", icono: "ChartColumn" },
      { href: "/tesoreria/pagos", texto: "Pagos por validar", icono: "ShieldCheck", cuenta: porValidar },
      { href: "/tesoreria/caja", texto: "Registrar pago en caja", icono: "Wallet" },
      { href: "/tesoreria/facturas", texto: "Facturas", icono: "Receipt" },
    ]}>{children}</StaffShell>
  );
}
