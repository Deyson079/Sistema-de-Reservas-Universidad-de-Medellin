import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSesion } from "@/lib/auth";
import { fechaAIso, ahora, sumarDias, isoAFecha } from "@/lib/formato";
import { ESTADOS, METODOS } from "@/lib/estados";

const esc = (v: unknown) => { const s = String(v ?? ""); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const xmlEsc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function salida(nombre: string, cabecera: string[], filas: Array<Array<string | number>>, formato: string) {
  if (formato === "xls") {
    // Hoja de cálculo XML (SpreadsheetML): Excel la abre directamente
    const fila = (c: Array<string | number>, estilo = "") => `<Row>${c.map((v) => `<Cell${estilo}><Data ss:Type="${typeof v === "number" ? "Number" : "String"}">${xmlEsc(v)}</Data></Cell>`).join("")}</Row>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#C2262B" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="${xmlEsc(nombre.slice(0, 30))}"><Table>${fila(cabecera, ' ss:StyleID="h"')}${filas.map((f) => fila(f)).join("")}</Table></Worksheet></Workbook>`;
    return new NextResponse(xml, { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="${nombre}.xls"` } });
  }
  const csv = "﻿" + [cabecera, ...filas].map((f) => f.map(esc).join(";")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nombre}.csv"` } });
}

export async function GET(req: NextRequest) {
  const s = await getSesion();
  if (!s || s.k !== "p") return new NextResponse("No autorizado", { status: 401 });
  const p = req.nextUrl.searchParams;
  const tipo = p.get("tipo"), formato = p.get("formato") ?? "csv", estado = p.get("estado") ?? "todas", q = p.get("q");
  const hoy = ahora().iso;
  if (tipo === "facturas" && ["tesoreria", "administrador"].includes(s.rol)) {
    const where: Prisma.FacturaWhereInput = { ...(estado !== "todas" ? { estado: estado as never } : {}), ...(q ? { OR: [{ numero: { contains: q, mode: "insensitive" } }, { reserva: { codigo: { contains: q.toUpperCase() } } }] } : {}) };
    const fs = await db.factura.findMany({ where, include: { reserva: { include: { usuario: { include: { facturacion: true } }, cancha: true } } }, orderBy: { creadaEn: "desc" } });
    return salida(`facturas-${estado}-${hoy}`, ["Número", "Estado", "Emitida", "Vence", "Cliente", "NIT o cédula", "Correo", "Reserva", "Escenario", "Fecha reserva", "Hora", "Valor", "IVA", "Total"],
      fs.map((f) => [f.numero, f.estado, fechaAIso(f.creadaEn), fechaAIso(f.venceEn), f.reserva.usuario.facturacion?.razonSocial ?? f.reserva.usuario.nombres, f.reserva.usuario.facturacion?.nitCedula ?? f.reserva.usuario.documento, f.reserva.usuario.correo, f.reserva.codigo, f.reserva.cancha.nombre, fechaAIso(f.reserva.fecha), `${f.reserva.horaInicio}:00`, f.valor, f.iva, f.total]), formato);
  }
  if (tipo === "pagos" && ["tesoreria", "administrador"].includes(s.rol)) {
    const ps = await db.pago.findMany({ where: estado !== "todos" ? { estado: estado as never } : {}, include: { factura: { include: { reserva: { include: { usuario: true } } } }, validadoPor: true }, orderBy: { fecha: "desc" } });
    return salida(`pagos-${estado}-${hoy}`, ["Fecha", "Factura", "Cliente", "Método", "Referencia", "Valor", "Estado", "Revisó", "Motivo de rechazo"],
      ps.map((x) => [x.fecha.toISOString(), x.factura.numero, x.factura.reserva.usuario.nombres, METODOS[x.metodo]!, x.referencia ?? "", x.valor, x.estado, x.validadoPor?.nombre ?? "", x.motivoRechazo ?? ""]), formato);
  }
  if (tipo === "reservas" && ["bienestar", "administrador"].includes(s.rol)) {
    const desde = p.get("desde") ?? sumarDias(hoy, -30), hasta = p.get("hasta") ?? hoy;
    const rs = await db.reserva.findMany({ where: { fecha: { gte: isoAFecha(desde), lte: isoAFecha(hasta) }, ...(p.get("cancha") ? { cancha: { slug: p.get("cancha")! } } : {}), ...(p.get("tipoUsuario") ? { usuario: { tipo: p.get("tipoUsuario") as never } } : {}) }, include: { usuario: true, cancha: true, factura: true }, orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }] });
    return salida(`reservas-${desde}-a-${hasta}`, ["Código", "Fecha", "Hora", "Escenario", "Actividad", "Participantes", "Estado", "Tipo de usuario", "Usuario", "Correo", "Valor"],
      rs.map((r) => [r.codigo, fechaAIso(r.fecha), `${r.horaInicio}:00`, r.cancha.nombre, r.actividad, r.participantes, ESTADOS[r.estado], r.usuario.tipo, `${r.usuario.nombres} ${r.usuario.apellidos}`.trim(), r.usuario.correo, r.factura?.total ?? 0]), formato);
  }
  return new NextResponse("Tipo de reporte no válido", { status: 400 });
}
