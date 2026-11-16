import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
export const metadata = { title: "Acceso del personal" };
export default function LayoutPersonal({ children }: { children: React.ReactNode }) {
  return (
    <main className="staff-auth" id="contenido">
      <div style={{ display: "grid", justifyItems: "center", width: "100%" }}>
        <Suspense>{children}</Suspense>
        <Link href="/" className="staff-volver"><ArrowLeft className="i i-sm" />Volver al sitio público</Link>
      </div>
    </main>
  );
}
