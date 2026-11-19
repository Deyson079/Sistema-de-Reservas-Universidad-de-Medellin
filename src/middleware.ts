import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sesionDesdeClaims, type Sesion } from "@/lib/sesion";
import { ajustarCookie, COOKIE_RECORDAR, supabaseAnon, supabaseConfigurado, supabaseUrl } from "@/lib/supabase/config";

const USUARIO = ["/portal", "/pago", "/factura"];
const PERSONAL: Record<string, string[]> = { "/tesoreria": ["tesoreria"], "/bienestar": ["bienestar"], "/admin": ["administrador"] };

/** Cookies de sesión de Supabase: sb-<proyecto>-auth-token (puede venir partida en .0, .1…) */
const tieneCookieSesion = (req: NextRequest) => req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  let res = NextResponse.next({ request: req });
  let s: Sesion | null = null;

  // Renueva la sesión de Supabase (si caduca el access token, aquí se guarda el nuevo).
  // Sin cookies de sesión no hay nada que renovar: los visitantes anónimos no pasan por Supabase.
  if (supabaseConfigurado() && tieneCookieSesion(req)) {
    const recordar = req.cookies.get(COOKIE_RECORDAR)?.value === "1";
    const sb = createServerClient(supabaseUrl(), supabaseAnon(), {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) req.cookies.set(name, value);
          res = NextResponse.next({ request: req });
          for (const { name, value, options } of lista) res.cookies.set(name, value, ajustarCookie(options, recordar));
        },
      },
    });
    const { data } = await sb.auth.getClaims();
    s = sesionDesdeClaims(data?.claims);
  }

  const redirigir = (url: URL) => {
    const r = NextResponse.redirect(url);
    for (const c of res.cookies.getAll()) r.cookies.set(c);
    return r;
  };

  if (USUARIO.some((p) => pathname.startsWith(p))) {
    // Las facturas también las ven Tesorería y el administrador
    if (pathname.startsWith("/factura") && s?.k === "p") return res;
    if (!s || s.k !== "u") {
      const url = new URL("/ingresar", req.url);
      url.searchParams.set("siguiente", pathname + search);
      return redirigir(url);
    }
  }
  for (const [p, roles] of Object.entries(PERSONAL)) {
    if (pathname.startsWith(p)) {
      if (!s || s.k !== "p") return redirigir(new URL("/personal", req.url));
      if (!roles.includes(s.rol) && s.rol !== "administrador") return redirigir(new URL(`/personal?error=permiso`, req.url));
    }
  }
  // La antigua marca del doble factor ya no se usa
  if (req.cookies.has("udem_personal")) res.cookies.delete("udem_personal");
  return res;
}

// Corre en todas las páginas (no en archivos estáticos) para mantener viva la sesión de Supabase
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|brand/|uploads/|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js|map|woff2?|txt|xml|webmanifest|pdf)$).*)"],
};
