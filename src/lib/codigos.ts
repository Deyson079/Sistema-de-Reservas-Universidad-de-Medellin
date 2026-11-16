import "server-only";
import { createHash, randomInt } from "crypto";
import { db } from "./db";
import type { TipoCodigo } from "@prisma/client";

const MINUTOS = 10;
const MAX_INTENTOS = 5;
const ESPERA_REENVIO_S = 60;

const h = (c: string) => createHash("sha256").update(c).digest("hex");

// Solo en modo "consola": guarda el último código para mostrarlo en pantalla (pruebas sin correo)
const g = globalThis as unknown as { codigosDemo?: Map<string, string> };
export const codigosDemo = (g.codigosDemo ??= new Map());

export async function generarCodigo(correo: string, tipo: TipoCodigo) {
  correo = correo.toLowerCase();
  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.codigoVerificacion.updateMany({ where: { correo, tipo, usado: false }, data: { usado: true } });
  const reg = await db.codigoVerificacion.create({
    data: { correo, tipo, codigo: h(codigo), expiraEn: new Date(Date.now() + MINUTOS * 60_000) },
  });
  if (process.env.EMAIL_MODO !== "smtp") codigosDemo.set(`${tipo}:${correo}`, codigo);
  return { codigo, expiraEn: reg.expiraEn };
}

export async function puedeReenviar(correo: string, tipo: TipoCodigo) {
  const ult = await db.codigoVerificacion.findFirst({ where: { correo: correo.toLowerCase(), tipo }, orderBy: { creadoEn: "desc" } });
  if (!ult) return { ok: true, espera: 0 };
  const pasados = (Date.now() - ult.creadoEn.getTime()) / 1000;
  return { ok: pasados >= ESPERA_REENVIO_S, espera: Math.max(0, Math.ceil(ESPERA_REENVIO_S - pasados)) };
}

export async function codigoVigente(correo: string, tipo: TipoCodigo) {
  return db.codigoVerificacion.findFirst({ where: { correo: correo.toLowerCase(), tipo, usado: false }, orderBy: { creadoEn: "desc" } });
}

export type ResultadoCodigo = "ok" | "incorrecto" | "vencido" | "agotado" | "inexistente";

export async function verificarCodigo(correo: string, tipo: TipoCodigo, codigo: string, consumir = true): Promise<{ r: ResultadoCodigo; restantes?: number }> {
  const c = await codigoVigente(correo, tipo);
  if (!c) return { r: "inexistente" };
  if (c.expiraEn < new Date()) return { r: "vencido" };
  if (c.intentos >= MAX_INTENTOS) return { r: "agotado" };
  if (c.codigo !== h(codigo)) {
    await db.codigoVerificacion.update({ where: { id: c.id }, data: { intentos: { increment: 1 } } });
    const restantes = MAX_INTENTOS - c.intentos - 1;
    return { r: restantes <= 0 ? "agotado" : "incorrecto", restantes };
  }
  if (consumir) await db.codigoVerificacion.update({ where: { id: c.id }, data: { usado: true } });
  return { r: "ok" };
}
