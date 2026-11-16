// Firma y lectura del token de sesión (compatible con el middleware en edge)
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "udem_sesion";

export type Sesion = {
  sub: string;
  k: "u" | "p"; // usuario o personal
  rol: string; // comunidad | externo | tesoreria | bienestar | administrador
  nombre: string;
};

const clave = () => new TextEncoder().encode(process.env.AUTH_SECRET || "desarrollo-inseguro-cambia-AUTH_SECRET");

export async function firmar(s: Sesion, dias: number) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${dias}d`)
    .sign(clave());
}

export async function leer(token?: string): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave());
    return payload as unknown as Sesion;
  } catch {
    return null;
  }
}
