import "server-only";
import QRCode from "qrcode";
import { renderCorreo, type Plantilla } from "./correos";

/** Envía un correo transaccional. En modo "consola" solo lo registra en la terminal. */
export async function enviarCorreo(para: string, p: Plantilla) {
  const conQr = "qrSrc" in p;
  const attachments: Array<{ filename: string; content: Buffer; cid: string }> = [];
  if (conQr && process.env.EMAIL_MODO === "smtp") {
    const codigo = (p as { reserva: { codigo: string } }).reserva.codigo;
    attachments.push({ filename: "qr.png", content: await QRCode.toBuffer(codigo, { width: 360, margin: 1 }), cid: "qr-reserva" });
    (p as { qrSrc: string }).qrSrc = "cid:qr-reserva";
  }
  const { asunto, html } = renderCorreo(p);
  if (process.env.EMAIL_MODO !== "smtp") {
    console.log(`\n✉️  [correo:consola] Para: ${para}\n   Asunto: ${asunto}\n`);
    return;
  }
  try {
    const nodemailer = (await import("nodemailer")).default;
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await t.sendMail({ from: process.env.EMAIL_DESDE, to: para, subject: asunto, html, attachments });
  } catch (e) {
    console.error("Error enviando correo", e);
  }
}

const qrMemo = new Map<string, Promise<string>>();
/** QR en data URL. Se memoriza: el mismo código siempre produce la misma imagen. */
export function qrDataUrl(texto: string): Promise<string> {
  let q = qrMemo.get(texto);
  if (!q) {
    if (qrMemo.size > 500) qrMemo.clear();
    q = QRCode.toDataURL(texto, { width: 360, margin: 1, color: { dark: "#16222F", light: "#FFFFFF" } });
    q.catch(() => qrMemo.delete(texto));
    qrMemo.set(texto, q);
  }
  return q;
}
