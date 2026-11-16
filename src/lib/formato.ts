// Formatos de Colombia: moneda $80.000 COP, fechas "lunes 16 de noviembre", horas "6:00 p. m."
// La hora oficial de Colombia es UTC-5 todo el año (sin horario de verano).

const OFFSET_H = 5;
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_C = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function moneda(n: number, cop = true) {
  const s = "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return cop ? s + " COP" : s;
}

/** Fecha y hora actuales en Bogotá */
export function ahora() {
  const d = new Date(Date.now() - OFFSET_H * 3600_000);
  return {
    iso: d.toISOString().slice(0, 10),
    hora: d.getUTCHours(),
    minuto: d.getUTCMinutes(),
    diaSemana: d.getUTCDay(),
  };
}

export function isoAFecha(iso: string) {
  return new Date(iso + "T00:00:00.000Z");
}
export function fechaAIso(d: Date) {
  return d.toISOString().slice(0, 10);
}
export function sumarDias(iso: string, n: number) {
  const d = isoAFecha(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fechaAIso(d);
}
/** Instante real (UTC) en que empieza una franja de Bogotá */
export function inicioFranja(iso: string, hora: number) {
  const d = isoAFecha(iso);
  return new Date(d.getTime() + (hora + OFFSET_H) * 3600_000);
}

function partes(f: string | Date) {
  const d = typeof f === "string" ? isoAFecha(f.slice(0, 10)) : f;
  return { dia: d.getUTCDay(), n: d.getUTCDate(), m: d.getUTCMonth(), a: d.getUTCFullYear() };
}

/** "lunes 16 de noviembre" */
export function fechaLarga(f: string | Date, conAnio = false) {
  const p = partes(f);
  return `${DIAS[p.dia]} ${p.n} de ${MESES[p.m]}${conAnio ? ` de ${p.a}` : ""}`;
}
/** "lun 16 nov" */
export function fechaCorta(f: string | Date) {
  const p = partes(f);
  return `${DIAS_C[p.dia]} ${p.n} ${MESES_C[p.m]}`;
}
export function diaCorto(f: string | Date) {
  return DIAS_C[partes(f).dia];
}
export function nombreMes(m: number) {
  return MESES[m];
}

/** "6:00 p. m." */
export function hora(h: number, min = 0) {
  const sufijo = h < 12 || h === 24 ? "a. m." : "p. m.";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(min).padStart(2, "0")} ${sufijo}`;
}
export function franja(h: number, h2 = h + 1) {
  return `${hora(h)} – ${hora(h2)}`;
}

/** Fecha y hora de un instante, en Bogotá: "lunes 16 de noviembre, 4:12 p. m." */
export function fechaHora(d: Date) {
  const b = new Date(d.getTime() - OFFSET_H * 3600_000);
  return `${fechaLarga(b)}, ${hora(b.getUTCHours(), b.getUTCMinutes())}`;
}
export function horaDe(d: Date) {
  const b = new Date(d.getTime() - OFFSET_H * 3600_000);
  return hora(b.getUTCHours(), b.getUTCMinutes());
}
/** Hace cuánto: "hace 5 min", "hace 2 h", o la fecha */
export function haceCuanto(d: Date) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return fechaHora(d);
}

export function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
