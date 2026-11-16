import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, leer } from "@/lib/sesion-token";

const USUARIO = ["/portal", "/pago", "/factura"];
const PERSONAL: Record<string, string[]> = { "/tesoreria": ["tesoreria"], "/bienestar": ["bienestar"], "/admin": ["administrador"] };

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const s = await leer(req.cookies.get(COOKIE)?.value);
  if (USUARIO.some((p) => pathname.startsWith(p))) {
    // Las facturas también las ven Tesorería y el administrador
    if (pathname.startsWith("/factura") && s?.k === "p") return NextResponse.next();
    if (!s || s.k !== "u") {
      const url = new URL("/ingresar", req.url);
      url.searchParams.set("siguiente", pathname + search);
      return NextResponse.redirect(url);
    }
  }
  for (const [p, roles] of Object.entries(PERSONAL)) {
    if (pathname.startsWith(p)) {
      if (!s || s.k !== "p") return NextResponse.redirect(new URL("/personal", req.url));
      if (!roles.includes(s.rol) && s.rol !== "administrador") return NextResponse.redirect(new URL(`/personal?error=permiso`, req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/portal/:path*", "/pago/:path*", "/factura/:path*", "/tesoreria/:path*", "/bienestar/:path*", "/admin/:path*"] };
