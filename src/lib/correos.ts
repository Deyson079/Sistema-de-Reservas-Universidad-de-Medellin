// Plantillas de correos transaccionales (600 px, estilos en línea para clientes de correo)
import { moneda } from "./formato";

const APP = () => process.env.APP_URL || "http://localhost:3000";
const ROJO = "#C2262B", TINTA = "#16222F", GRIS = "#4A5560", FONDO = "#F5F6F7", AMARILLO = "#F3D941";
const DISPLAY = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const TEXTO = "'Open Sans',Arial,Helvetica,sans-serif";

export type DatosReserva = { cancha: string; fecha: string; franja: string; codigo: string };

function boton(texto: string, url: string, color = ROJO) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="background:${color};border-radius:8px">
  <a href="${url}" style="display:inline-block;padding:14px 26px;font-family:${TEXTO};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${texto}</a></td></tr></table>`;
}

function tablaReserva(r: DatosReserva, extra: Array<[string, string]> = []) {
  const filas: Array<[string, string]> = [["Escenario", r.cancha], ["Fecha", r.fecha], ["Hora", r.franja], ["Código", r.codigo], ...extra];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #E1E4E6;border-radius:12px;border-collapse:separate">
  ${filas.map(([k, v], i) => `<tr><td style="padding:12px 16px;font-family:${TEXTO};font-size:14px;color:${GRIS};${i ? "border-top:1px dashed #E1E4E6;" : ""}">${k}</td><td align="right" style="padding:12px 16px;font-family:${TEXTO};font-size:14px;font-weight:700;color:${TINTA};${i ? "border-top:1px dashed #E1E4E6;" : ""}">${v}</td></tr>`).join("")}
  </table>`;
}

function codigoGrande(c: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr>${c
    .split("")
    .map((d) => `<td style="width:48px;height:60px;border:2px solid ${TINTA};border-radius:8px;text-align:center;font-family:${DISPLAY};font-size:32px;font-weight:800;color:${TINTA}">${d}</td><td style="width:8px"></td>`)
    .join("")}</tr></table>`;
}

function aviso(texto: string, fondo = "#FBEFDC", color = "#6B4000") {
  return `<p style="margin:16px 0;padding:12px 14px;background:${fondo};color:${color};border-radius:8px;font-family:${TEXTO};font-size:14px;line-height:21px">${texto}</p>`;
}

function marco(opts: { preencabezado: string; titulo: string; cuerpo: string; etiqueta?: string; colorEtiqueta?: string }) {
  const app = APP();
  return `<!DOCTYPE html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${opts.titulo}</title></head>
<body style="margin:0;padding:0;background:${FONDO}">
<div style="display:none;max-height:0;overflow:hidden">${opts.preencabezado}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FONDO}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="background:${ROJO};padding:24px 32px 22px">
    <table role="presentation" width="100%"><tr>
      <td><img src="${app}/brand/logo-blanco.png" width="160" alt="Universidad de Medellín" style="display:block;border:0;width:160px;height:auto"></td>
      <td align="right" style="font-family:${DISPLAY};font-size:15px;font-weight:700;letter-spacing:.04em;color:#FFE5E6;text-transform:uppercase">Reservas<br>Deportivas</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:6px;background:${AMARILLO};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:32px 32px 8px">
    ${opts.etiqueta ? `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${opts.colorEtiqueta || "#E5F2EB"};font-family:${TEXTO};font-size:12px;font-weight:700;color:${TINTA}">${opts.etiqueta}</span>` : ""}
    <h1 style="margin:12px 0 0;font-family:${DISPLAY};font-size:40px;line-height:40px;font-weight:800;text-transform:uppercase;color:${TINTA}">${opts.titulo}</h1>
  </td></tr>
  <tr><td style="padding:0 32px 32px;font-family:${TEXTO};font-size:16px;line-height:25px;color:${TINTA}">${opts.cuerpo}</td></tr>
  <tr><td style="padding:22px 32px;background:${TINTA};font-family:${TEXTO};font-size:12px;line-height:19px;color:#AEB8C2">
    Bienestar Universitario, área de Deportes · Universidad de Medellín<br>
    Carrera 87 N.° 30-65, Belén Los Alpes, Medellín · (604) 340 5555 · deportes@udemedellin.edu.co<br>
    <strong style="color:#ffffff">Vigilada MinEducación</strong><br>
    <span style="color:#7F8C98">Recibes este correo porque tienes una cuenta en Reservas Deportivas Universidad de Medellín. Puedes cambiar tus avisos en <a href="${app}/portal/perfil" style="color:#AEB8C2">Mi perfil</a>.</span>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export type Plantilla =
  | { tipo: "codigo_verificacion"; nombre: string; codigo: string }
  | { tipo: "codigo_doble_factor"; nombre: string; codigo: string }
  | { tipo: "bienvenida"; nombre: string; comunidad: boolean }
  | { tipo: "codigo_recuperacion"; nombre: string; codigo: string }
  | { tipo: "reserva_confirmada"; nombre: string; reserva: DatosReserva; qrSrc: string }
  | { tipo: "factura_generada"; nombre: string; reserva: DatosReserva; numero: string; total: number; limite: string; facturaId: string }
  | { tipo: "pago_recibido"; nombre: string; numero: string; metodo: string; valor: number }
  | { tipo: "pago_aprobado"; nombre: string; reserva: DatosReserva; qrSrc: string }
  | { tipo: "pago_rechazado"; nombre: string; numero: string; motivo: string; facturaId: string }
  | { tipo: "recordatorio"; nombre: string; reserva: DatosReserva }
  | { tipo: "reserva_vencida"; nombre: string; reserva: DatosReserva }
  | { tipo: "reserva_cancelada"; nombre: string; reserva: DatosReserva; motivo: string; porBienestar: boolean };

export function renderCorreo(p: Plantilla): { asunto: string; html: string } {
  const app = APP();
  const hola = `<p style="margin:16px 0 0">Hola, ${p.nombre}:</p>`;
  switch (p.tipo) {
    case "codigo_verificacion":
      return { asunto: `${p.codigo} es tu código de verificación`, html: marco({ preencabezado: `Tu código es ${p.codigo}. Vence en 10 minutos.`, titulo: "Verifica tu correo", cuerpo: `${hola}<p>Escribe este código en la plataforma para activar tu cuenta:</p>${codigoGrande(p.codigo)}<p style="color:${GRIS};font-size:14px">Vence en 10 minutos. Si no creaste una cuenta, ignora este correo.</p>` }) };
    case "codigo_doble_factor":
      return { asunto: `${p.codigo} es tu código de acceso del personal`, html: marco({ preencabezado: `Código de acceso: ${p.codigo}`, titulo: "Código de acceso", etiqueta: "Acceso del personal", colorEtiqueta: "#E1E4E6", cuerpo: `${hola}<p>Alguien está ingresando a tu cuenta del personal. Si eres tú, escribe este código:</p>${codigoGrande(p.codigo)}${aviso("Si no fuiste tú, cambia tu contraseña y avisa al administrador de la plataforma.", "#FBE8E6", "#7D1A15")}` }) };
    case "bienvenida":
      return { asunto: "Bienvenido a Reservas Deportivas Universidad de Medellín", html: marco({ preencabezado: "Tu cuenta está lista. Ya puedes reservar.", titulo: "Tu cuenta está lista", etiqueta: p.comunidad ? "Comunidad Universidad de Medellín · sin costo" : "Externo · con pago", colorEtiqueta: p.comunidad ? "#EAF0F5" : "#FBEDEE", cuerpo: `${hola}<p>Ya puedes reservar las canchas polideportivas de la Universidad de Medellín por franjas de 1 hora, hasta con 14 días de anticipación.</p>${p.comunidad ? aviso("Con tu correo institucional no pagas: tus reservas quedan confirmadas al instante.", "#EAF0F5", "#2B445F") : aviso("Al reservar, tu horario queda apartado 48 horas mientras pagas. Tesorería valida el pago y confirma tu reserva.")}${boton("Reservar una cancha", `${app}/portal/reservar`)}` }) };
    case "codigo_recuperacion":
      return { asunto: `${p.codigo} es tu código para cambiar la contraseña`, html: marco({ preencabezado: `Código para cambiar tu contraseña: ${p.codigo}`, titulo: "Cambia tu contraseña", cuerpo: `${hola}<p>Recibimos una solicitud para cambiar tu contraseña. Escribe este código en la plataforma:</p>${codigoGrande(p.codigo)}<p style="color:${GRIS};font-size:14px">Vence en 10 minutos. Si no lo pediste, ignora este correo: tu contraseña no cambia.</p>` }) };
    case "reserva_confirmada":
    case "pago_aprobado": {
      const pago = p.tipo === "pago_aprobado";
      return { asunto: `Reserva confirmada: ${p.reserva.cancha}, ${p.reserva.fecha}`, html: marco({ preencabezado: `${p.reserva.cancha}, ${p.reserva.fecha}, ${p.reserva.franja}`, titulo: pago ? "Pago aprobado: ¡a jugar!" : "Reserva confirmada", etiqueta: "✓ Confirmada", cuerpo: `${hola}<p>${pago ? "Tesorería validó tu pago. " : ""}Tu reserva quedó confirmada. Muestra este código QR en la entrada del escenario junto con tu documento.</p>${tablaReserva(p.reserva)}<table role="presentation" width="100%"><tr><td align="center" style="padding:8px 0 4px"><img src="${p.qrSrc}" width="180" height="180" alt="Código QR de la reserva ${p.reserva.codigo}" style="display:block;border:0"></td></tr><tr><td align="center" style="font-family:${DISPLAY};font-size:22px;font-weight:700;letter-spacing:.06em">${p.reserva.codigo}</td></tr></table>${boton("Ver mi reserva", `${app}/portal/reservas/${p.reserva.codigo}`)}<p style="color:${GRIS};font-size:14px">Llega 10 minutos antes. Si no puedes asistir, cancela desde Mis reservas para liberar la franja.</p>` }) };
    }
    case "factura_generada":
      return { asunto: `Factura ${p.numero}: paga antes del ${p.limite}`, html: marco({ preencabezado: `Total ${moneda(p.total)}. Tu horario queda apartado 48 horas.`, titulo: "Tu horario está apartado", etiqueta: "Pendiente de pago", colorEtiqueta: "#FBEFDC", cuerpo: `${hola}<p>Generamos la factura de tu reserva. Paga antes del <strong>${p.limite}</strong> o la franja se libera.</p>${tablaReserva(p.reserva, [["Factura", p.numero], ["Total", moneda(p.total)]])}${boton("Pagar en línea", `${app}/pago/${p.facturaId}`)}<p style="color:${GRIS};font-size:14px">¿Pagaste por transferencia o consignación? <a href="${app}/pago/${p.facturaId}/comprobante" style="color:${ROJO};font-weight:700">Sube el comprobante</a>.</p>` }) };
    case "pago_recibido":
      return { asunto: `Recibimos tu pago de la factura ${p.numero}`, html: marco({ preencabezado: "Tesorería lo revisará en menos de 1 día hábil.", titulo: "Recibimos tu pago", etiqueta: "En validación", colorEtiqueta: "#E6EEF6", cuerpo: `${hola}<p>Recibimos tu pago de <strong>${moneda(p.valor)}</strong> por ${p.metodo} para la factura ${p.numero}.</p>${aviso("Tesorería lo revisará en menos de 1 día hábil. Te avisamos por correo cuando tu reserva quede confirmada.", "#E6EEF6", "#2B5F8A")}` }) };
    case "pago_rechazado":
      return { asunto: `Tu pago de la factura ${p.numero} fue rechazado`, html: marco({ preencabezado: p.motivo, titulo: "Revisa tu pago", etiqueta: "Rechazado", colorEtiqueta: "#FBE8E6", cuerpo: `${hola}<p>Tesorería revisó tu pago de la factura ${p.numero} y no pudo validarlo.</p>${aviso(`<strong>Motivo:</strong> ${p.motivo}`, "#FBE8E6", "#7D1A15")}<p>Puedes pagar de nuevo mientras el horario siga apartado.</p>${boton("Pagar de nuevo", `${app}/pago/${p.facturaId}`)}` }) };
    case "recordatorio":
      return { asunto: `Mañana juegas: ${p.reserva.cancha}, ${p.reserva.franja}`, html: marco({ preencabezado: "Recuerda llevar tu documento y el QR.", titulo: "Mañana juegas", etiqueta: "Recordatorio", colorEtiqueta: "#FCF6D3", cuerpo: `${hola}<p>Te recordamos tu reserva para mañana:</p>${tablaReserva(p.reserva)}<p>Lleva tu documento y el código QR. Si no puedes asistir, cancela para que otros puedan usar la cancha.</p>${boton("Ver mi reserva", `${app}/portal/reservas/${p.reserva.codigo}`)}` }) };
    case "reserva_vencida":
      return { asunto: `Tu reserva ${p.reserva.codigo} venció`, html: marco({ preencabezado: "No recibimos el pago a tiempo y la franja se liberó.", titulo: "Tu reserva venció", etiqueta: "Vencida", colorEtiqueta: "#E1E4E6", cuerpo: `${hola}<p>No recibimos el pago dentro de las 48 horas, así que la reserva venció y la franja quedó libre.</p>${tablaReserva(p.reserva)}${boton("Reservar otra franja", `${app}/portal/reservar`)}` }) };
    case "reserva_cancelada":
      return { asunto: `Reserva cancelada: ${p.reserva.cancha}, ${p.reserva.fecha}`, html: marco({ preencabezado: p.motivo, titulo: "Reserva cancelada", etiqueta: "Cancelada", colorEtiqueta: "#E1E4E6", cuerpo: `${hola}<p>${p.porBienestar ? "Bienestar Universitario canceló tu reserva." : "Cancelaste tu reserva."}</p>${tablaReserva(p.reserva)}${aviso(`<strong>Motivo:</strong> ${p.motivo}`, "#F5F6F7", TINTA)}${p.porBienestar ? "<p>Lamentamos el cambio. Puedes elegir otra franja sin costo adicional; si ya habías pagado, Tesorería te contactará.</p>" : ""}${boton("Reservar otra franja", `${app}/portal/reservar`)}` }) };
  }
}

/** Datos de ejemplo para la vista previa de cada plantilla */
export function ejemplosCorreo(qrSrc: string): Record<string, Plantilla> {
  const reserva = { cancha: "Coliseo cubierto", fecha: "martes 17 de noviembre", franja: "6:00 p. m. – 7:00 p. m.", codigo: "RD-24830" };
  return {
    codigo_verificacion: { tipo: "codigo_verificacion", nombre: "Laura", codigo: "482913" },
    bienvenida: { tipo: "bienvenida", nombre: "Laura", comunidad: true },
    codigo_recuperacion: { tipo: "codigo_recuperacion", nombre: "Laura", codigo: "730215" },
    reserva_confirmada: { tipo: "reserva_confirmada", nombre: "Laura", reserva, qrSrc },
    factura_generada: { tipo: "factura_generada", nombre: "Deportes del Valle S.A.S.", reserva: { ...reserva, cancha: "Cancha sintética", codigo: "RD-24817" }, numero: "FV-2026-000214", total: 150000, limite: "miércoles 18 de noviembre, 4:12 p. m.", facturaId: "demo" },
    pago_recibido: { tipo: "pago_recibido", nombre: "Deportes del Valle S.A.S.", numero: "FV-2026-000214", metodo: "transferencia", valor: 150000 },
    pago_aprobado: { tipo: "pago_aprobado", nombre: "Deportes del Valle S.A.S.", reserva: { ...reserva, cancha: "Cancha sintética", codigo: "RD-24817" }, qrSrc },
    pago_rechazado: { tipo: "pago_rechazado", nombre: "Juan Pablo", numero: "FV-2026-000209", motivo: "El valor del comprobante ($70.000) no coincide con el total de la factura ($80.000).", facturaId: "demo" },
    recordatorio: { tipo: "recordatorio", nombre: "Laura", reserva },
    reserva_vencida: { tipo: "reserva_vencida", nombre: "Club Montañeros", reserva: { ...reserva, codigo: "RD-24795" } },
    reserva_cancelada: { tipo: "reserva_cancelada", nombre: "Laura", reserva, motivo: "Evento institucional: Juegos Interfacultades.", porBienestar: true },
  };
}
