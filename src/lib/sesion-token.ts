// Tokens firmados propios (p. ej., la marca de recuperación de contraseña).
import { SignJWT, jwtVerify } from "jose";
import type { Sesion } from "./sesion";

export type { Sesion } from "./sesion";
export { sesionDesdeClaims } from "./sesion";

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
