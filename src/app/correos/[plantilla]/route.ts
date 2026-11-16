import { renderCorreo, ejemplosCorreo } from "@/lib/correos";
import { qrDataUrl } from "@/lib/email";
import { getSesion } from "@/lib/auth";

/** HTML real de cada correo (600 px), con datos de ejemplo */
export async function GET(_: Request, { params }: { params: Promise<{ plantilla: string }> }) {
  const s = await getSesion();
  if (process.env.MODO_DEMO !== "true" && (!s || s.k !== "p")) return new Response("No autorizado", { status: 401 });
  const { plantilla } = await params;
  const ej = ejemplosCorreo(await qrDataUrl("RD-24830"))[plantilla];
  if (!ej) return new Response("Plantilla no encontrada", { status: 404 });
  return new Response(renderCorreo(ej).html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
