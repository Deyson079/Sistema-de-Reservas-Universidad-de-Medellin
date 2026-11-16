import { requirePersonal } from "@/lib/auth";
import { StaffShell } from "@/components/staff/Shell";

export const metadata = { title: "Administración" };

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const p = await requirePersonal(["administrador"]);
  return (
    <StaffShell p={p} rol="administrador" items={[
      { href: "/admin/usuarios", texto: "Usuarios y personal", icono: "Users" },
      { href: "/admin/configuracion", texto: "Configuración", icono: "Settings" },
      { href: "/admin/auditoria", texto: "Auditoría", icono: "Fingerprint" },
      { href: "/correos", texto: "Plantillas de correo", icono: "Mail" },
    ]}>{children}</StaffShell>
  );
}
