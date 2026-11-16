// Datos iniciales: configuración, canchas, personal y datos de demostración realistas.
// Ejecuta: npm run db:seed   (borra y vuelve a crear los datos de demostración)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type EstadoReserva, type MetodoPago } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CONFIG_POR_DEFECTO } from "../src/lib/config";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DEMO = process.env.SEED_DEMO !== "false";

let semilla = 20261116;
const rnd = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
const elegir = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;

const OFF = 5; // Bogotá UTC-5
const hoyIso = new Date(Date.now() - OFF * 3600_000).toISOString().slice(0, 10);
const horaActual = new Date(Date.now() - OFF * 3600_000).getUTCHours();
const dia = (n: number) => { const d = new Date(hoyIso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d; };
const instante = (d: Date, h: number) => new Date(d.getTime() + (h + OFF) * 3600_000);

async function main() {
  console.log("Sembrando datos…");
  const pass = await bcrypt.hash("Cancha2026*", 10);

  // Configuración
  for (const [clave, valor] of Object.entries(CONFIG_POR_DEFECTO)) {
    await db.configuracion.upsert({ where: { clave }, create: { clave, valor: valor as never }, update: {} });
  }

  // Canchas
  const canchasDef = [
    { slug: "coliseo-cubierto", nombre: "Coliseo cubierto", deportes: ["Baloncesto", "Voleibol", "Fútbol sala"], capacidad: 30, dimensiones: "40 × 22 m", tarifaHora: 120000, ilustracion: "baloncesto", ubicacion: "Zona deportiva, junto a la portería principal", servicios: ["Cubierto", "Graderías", "Camerinos", "Iluminación"], descripcion: "Escenario cubierto con piso en madera para baloncesto, voleibol y fútbol sala. Ideal para jugar con lluvia o en la noche." },
    { slug: "cancha-sintetica", nombre: "Cancha sintética", deportes: ["Fútbol 8", "Fútbol 7"], capacidad: 22, dimensiones: "60 × 35 m", tarifaHora: 150000, ilustracion: "futbol", ubicacion: "Zona deportiva, costado occidental", servicios: ["Grama sintética", "Iluminación nocturna", "Camerinos", "Parqueadero cercano"], descripcion: "Grama sintética de última generación con iluminación para partidos nocturnos." },
    { slug: "placa-polideportiva-1", nombre: "Placa polideportiva 1", deportes: ["Microfútbol", "Baloncesto"], capacidad: 14, dimensiones: "32 × 18 m", tarifaHora: 80000, ilustracion: "placa", ubicacion: "Zona deportiva, frente al coliseo", servicios: ["Al aire libre", "Iluminación", "Bebederos"], descripcion: "Placa al aire libre con demarcación para microfútbol y baloncesto." },
    { slug: "cancha-de-voleibol", nombre: "Cancha de voleibol", deportes: ["Voleibol", "Voleibol playa"], capacidad: 12, dimensiones: "18 × 9 m", tarifaHora: 70000, ilustracion: "voleibol", ubicacion: "Zona deportiva, costado norte", servicios: ["Arena", "Malla reglamentaria"], descripcion: "Cancha de arena para voleibol y voleibol playa." },
  ];
  const canchas = [];
  for (const [i, c] of canchasDef.entries()) {
    canchas.push(await db.cancha.upsert({ where: { slug: c.slug }, create: { ...c, fotos: [], orden: i }, update: {} }));
  }

  // Personal
  const personal = [
    { correo: "tesoreria@udemedellin.edu.co", nombre: "María Cardona", rol: "tesoreria" as const },
    { correo: "bienestar@udemedellin.edu.co", nombre: "Andrés Giraldo", rol: "bienestar" as const },
    { correo: "admin@udemedellin.edu.co", nombre: "Sandra Henao", rol: "administrador" as const },
  ];
  const staff: Record<string, { id: string }> = {};
  for (const p of personal) staff[p.rol] = await db.personal.upsert({ where: { correo: p.correo }, create: { ...p, passwordHash: pass }, update: {} });

  if (!DEMO) { console.log("Listo (sin datos de demostración)."); return; }

  // Limpieza de datos de demostración
  await db.pago.deleteMany(); await db.factura.deleteMany(); await db.reserva.deleteMany(); await db.notificacion.deleteMany();
  await db.bloqueo.deleteMany(); await db.auditoria.deleteMany(); await db.codigoVerificacion.deleteMany();
  await db.datosFacturacion.deleteMany(); await db.usuario.deleteMany();

  // Usuarios de la comunidad
  const nombresCom = [
    ["Laura Marcela", "Restrepo Gómez", "lmrestrepo@soyudemedellin.edu.co", "estudiante", "Ingeniería de Sistemas"],
    ["Santiago", "Ochoa Vélez", "sochoa@soyudemedellin.edu.co", "estudiante", "Derecho"],
    ["Valentina", "Arango Ruiz", "varango@soyudemedellin.edu.co", "estudiante", "Comunicación"],
    ["Camilo", "Zapata Mejía", "czapata@udemedellin.edu.co", "docente", "Facultad de Ingenierías"],
    ["Daniela", "Henao Castro", "dhenao@soyudemedellin.edu.co", "estudiante", "Contaduría Pública"],
    ["Juan Esteban", "Mesa Londoño", "jmesa@udemedellin.edu.co", "administrativo", "Bienestar Universitario"],
    ["Mariana", "Correa Toro", "mcorrea@soyudemedellin.edu.co", "egresado", "Ingeniería Civil"],
    ["Sebastián", "Gil Montoya", "sgil@soyudemedellin.edu.co", "estudiante", "Ingeniería Financiera"],
    ["Isabela", "Ríos Duque", "irios@soyudemedellin.edu.co", "estudiante", "Psicología"],
    ["Mateo", "Cano Jaramillo", "mcano@soyudemedellin.edu.co", "estudiante", "Administración"],
  ] as const;
  const comunidad = [];
  for (const [i, [n, a, correo, rol, prog]] of nombresCom.entries()) {
    comunidad.push(await db.usuario.create({ data: { tipo: "comunidad", rol, nombres: n, apellidos: a, tipoDocumento: "CC", documento: String(1037552100 + i * 37), correo, correoVerificado: true, celular: `30045${String(10000 + i * 731).slice(0, 5)}`, programa: prog, passwordHash: pass, creadoEn: dia(-60 + i) } }));
  }
  // Externos
  const externosDef = [
    { nombres: "Deportes del Valle S.A.S.", correo: "contacto@deportesdelvalle.co", tipoPersona: "juridica" as const, nit: "901.245.778-3", ciudad: "Medellín", direccion: "Calle 10 N.° 43-12" },
    { nombres: "Juan Pablo", apellidos: "Ospina Rendón", correo: "juanpablo.ospina@gmail.com", tipoPersona: "natural" as const, nit: "1.037.552.104", ciudad: "Medellín", direccion: "Carrera 80 N.° 33-21" },
    { nombres: "Club Montañeros", correo: "club.montaneros@gmail.com", tipoPersona: "juridica" as const, nit: "900.881.320-1", ciudad: "Envigado", direccion: "Calle 38 Sur N.° 41-07" },
    { nombres: "Catalina", apellidos: "Vélez Arias", correo: "catavelez@hotmail.com", tipoPersona: "natural" as const, nit: "43.876.554", ciudad: "Medellín", direccion: "Transversal 39 N.° 72-15" },
  ];
  const externos = [];
  for (const [i, e] of externosDef.entries()) {
    externos.push(await db.usuario.create({ data: {
      tipo: "externo", rol: "externo", nombres: e.nombres, apellidos: e.apellidos ?? "", tipoDocumento: e.tipoPersona === "juridica" ? "NIT" : "CC", documento: e.nit,
      correo: e.correo, correoVerificado: true, celular: `31055${String(20000 + i * 911).slice(0, 5)}`, passwordHash: pass, creadoEn: dia(-50 + i),
      facturacion: { create: { tipoPersona: e.tipoPersona, nitCedula: e.nit, razonSocial: e.apellidos ? `${e.nombres} ${e.apellidos}` : e.nombres, direccion: e.direccion, ciudad: e.ciudad, rutUrl: i === 3 ? null : "/brand/rut-ejemplo.pdf" } },
    } }));
  }

  // Bloqueo: voleibol en mantenimiento hasta el viernes; evento institucional el sábado en el coliseo
  const voleibol = canchas[3]!, coliseo = canchas[0]!;
  await db.bloqueo.create({ data: { canchaId: voleibol.id, desde: instante(dia(-2), 6), hasta: instante(dia(4), 22), motivo: "Cambio de malla y demarcación", tipo: "mantenimiento", creadoPor: "Andrés Giraldo" } });
  await db.bloqueo.create({ data: { canchaId: coliseo.id, desde: instante(dia(5), 8), hasta: instante(dia(5), 14), motivo: "Juegos Interfacultades", tipo: "evento", creadoPor: "Andrés Giraldo" } });

  // Reservas: 30 días de historia + próximos 14 días
  const actividades: Record<string, string[]> = { "coliseo-cubierto": ["Baloncesto", "Voleibol", "Fútbol sala"], "cancha-sintetica": ["Fútbol 8", "Fútbol 7"], "placa-polideportiva-1": ["Microfútbol", "Baloncesto"], "cancha-de-voleibol": ["Voleibol"] };
  const demandaHora = (h: number) => (h >= 18 ? 0.85 : h >= 16 ? 0.55 : h >= 12 && h < 14 ? 0.45 : h < 8 ? 0.3 : 0.2);
  let nFactura = 1, nCodigo = 21000;
  const metodos: MetodoPago[] = ["tarjeta", "pse", "nequi", "transferencia", "daviplata", "caja"];

  for (let d = -30; d <= 13; d++) {
    const f = dia(d);
    if (f.getUTCDay() === 0) continue;
    for (const c of canchas) {
      for (let h = 6; h < 22; h++) {
        if (c.id === voleibol.id && d >= -2 && d <= 4) continue;
        if (c.id === coliseo.id && d === 5 && h >= 8 && h < 14) continue;
        const prob = demandaHora(h) * (d > 0 ? Math.max(0.15, 1 - d / 12) : 1) * (f.getUTCDay() === 6 ? 1.1 : 1);
        if (rnd() > prob) continue;
        const pasada = d < 0 || (d === 0 && h <= horaActual);
        const esExterno = rnd() < 0.28;
        const u = esExterno ? elegir(externos) : elegir(comunidad);
        let estado: EstadoReserva;
        if (pasada) { const x = rnd(); estado = x < 0.78 ? "asistio" : x < 0.86 ? "no_asistio" : x < 0.95 ? "cancelada" : esExterno ? "vencida" : "cancelada"; }
        else if (esExterno) { const x = rnd(); estado = x < 0.55 ? "confirmada" : x < 0.8 ? "pendiente_pago" : "en_validacion"; }
        else estado = "confirmada";
        const creada = new Date(instante(f, h).getTime() - (1 + Math.floor(rnd() * 5)) * 86400_000);
        const r = await db.reserva.create({ data: {
          codigo: `RD-${nCodigo++}`, usuarioId: u.id, canchaId: c.id, fecha: f, horaInicio: h, horaFin: h + 1,
          actividad: elegir(actividades[c.slug]!), participantes: Math.max(4, Math.floor(c.capacidad * (0.5 + rnd() * 0.5))),
          estado, creadaEn: creada,
          limitePago: estado === "pendiente_pago" ? new Date(Math.min(Date.now() + (6 + rnd() * 40) * 3600_000, instante(f, h).getTime() - 3600_000)) : null,
          motivoCancelacion: estado === "cancelada" ? elegir(["Se cruzó con una clase", "El equipo no estaba completo", "Lluvia"]) : null,
          canceladaPor: estado === "cancelada" ? "Usuario" : null,
        } });
        if (u.tipo === "externo") {
          const facturaEstado = estado === "pendiente_pago" || estado === "en_validacion" ? "sin_pagar" : estado === "vencida" ? "vencida" : estado === "cancelada" ? "anulada" : "pagada";
          const fac = await db.factura.create({ data: { reservaId: r.id, numero: `FV-2026-${String(nFactura++).padStart(6, "0")}`, valor: c.tarifaHora, iva: 0, total: c.tarifaHora, estado: facturaEstado, creadaEn: creada, venceEn: new Date(creada.getTime() + 48 * 3600_000) } });
          if (facturaEstado === "pagada") {
            const pagoEn = new Date(creada.getTime() + rnd() * 30 * 3600_000);
            await db.pago.create({ data: { facturaId: fac.id, metodo: elegir(metodos), referencia: String(88000000 + Math.floor(rnd() * 999999)), valor: fac.total, fechaPago: pagoEn, estado: "validado", validadoPorId: staff.tesoreria!.id, validadoEn: new Date(pagoEn.getTime() + 5 * 3600_000), fecha: pagoEn } });
          }
          if (estado === "en_validacion") {
            const m = elegir<MetodoPago>(["transferencia", "pse", "nequi", "tarjeta"]);
            await db.pago.create({ data: { facturaId: fac.id, metodo: m, referencia: String(88000000 + Math.floor(rnd() * 999999)), banco: m === "transferencia" || m === "pse" ? elegir(["Bancolombia", "Davivienda", "Banco de Bogotá"]) : null, comprobanteUrl: m === "transferencia" ? "/brand/comprobante-ejemplo.png" : null, valor: rnd() < 0.15 ? fac.total - 10000 : fac.total, fechaPago: new Date(Date.now() - rnd() * 40 * 3600_000), estado: "en_validacion", fecha: new Date(Date.now() - rnd() * 40 * 3600_000) } });
          }
        }
      }
    }
  }

  // Reservas fijas de la cuenta demo de comunidad (Laura) y externo (Deportes del Valle)
  const laura = comunidad[0]!, valle = externos[0]!;
  const libre = async (canchaId: string, d: number, h: number) => !(await db.reserva.findFirst({ where: { canchaId, fecha: dia(d), horaInicio: h, estado: { in: ["confirmada", "pendiente_pago", "en_validacion", "asistio", "no_asistio"] } } }));
  const fija = async (u: typeof laura, c: typeof coliseo, d: number, h: number, estado: EstadoReserva, extra: Record<string, unknown> = {}) => {
    if (!(await libre(c.id, d, h))) await db.reserva.deleteMany({ where: { canchaId: c.id, fecha: dia(d), horaInicio: h, factura: null } });
    if (!(await libre(c.id, d, h))) return null;
    return db.reserva.create({ data: { codigo: `RD-${nCodigo++}`, usuarioId: u.id, canchaId: c.id, fecha: dia(d), horaInicio: h, horaFin: h + 1, actividad: elegir(actividades[c.slug]!), participantes: 10, estado, ...extra } });
  };
  await fija(laura, coliseo, 1, 18, "confirmada");
  await fija(laura, canchas[2]!, 3, 17, "confirmada");
  await fija(laura, canchas[1]!, -3, 19, "asistio");
  await fija(laura, coliseo, -6, 18, "cancelada", { motivoCancelacion: "Se cruzó con una clase", canceladaPor: "Usuario" });
  const rv = await fija(valle, canchas[1]!, 2, 20, "pendiente_pago", { limitePago: new Date(Date.now() + 30 * 3600_000) });
  if (rv) await db.factura.create({ data: { reservaId: rv.id, numero: `FV-2026-${String(nFactura++).padStart(6, "0")}`, valor: 150000, total: 150000, venceEn: rv.limitePago! } });
  const rr = await fija(valle, canchas[2]!, 4, 19, "rechazada", { limitePago: new Date(Date.now() + 20 * 3600_000) });
  if (rr) {
    const fr = await db.factura.create({ data: { reservaId: rr.id, numero: `FV-2026-${String(nFactura++).padStart(6, "0")}`, valor: 80000, total: 80000, venceEn: rr.limitePago! } });
    await db.pago.create({ data: { facturaId: fr.id, metodo: "transferencia", referencia: "88213450", valor: 70000, fechaPago: dia(-1), estado: "rechazado", motivoRechazo: "El valor del comprobante ($70.000) no coincide con el total de la factura ($80.000).", validadoPorId: staff.tesoreria!.id, validadoEn: new Date(Date.now() - 5 * 3600_000), comprobanteUrl: "/brand/comprobante-ejemplo.png" } });
  }

  // Notificaciones de ejemplo
  await db.notificacion.createMany({ data: [
    { usuarioId: laura.id, tipo: "confirmada", titulo: "Reserva confirmada", mensaje: "Coliseo cubierto, mañana de 6:00 p. m. a 7:00 p. m.", enlace: "/portal/reservas", fecha: new Date(Date.now() - 2 * 3600_000) },
    { usuarioId: laura.id, tipo: "recordatorio", titulo: "Mañana juegas", mensaje: "Lleva tu documento y el código QR.", enlace: "/portal/reservas", fecha: new Date(Date.now() - 1 * 3600_000) },
    { usuarioId: laura.id, tipo: "cancelacion", titulo: "Bienestar canceló una reserva", mensaje: "Coliseo cubierto. Motivo: Juegos Interfacultades.", leida: true, fecha: new Date(Date.now() - 5 * 86400_000) },
    { usuarioId: valle.id, tipo: "factura", titulo: "Factura generada", mensaje: "Paga antes de que venza el plazo de 48 horas.", enlace: "/portal/pagos", fecha: new Date(Date.now() - 3 * 3600_000) },
    { usuarioId: valle.id, tipo: "pago_rechazado", titulo: "Pago rechazado", mensaje: "El valor del comprobante ($70.000) no coincide con el total de la factura ($80.000).", enlace: "/portal/reservas", fecha: new Date(Date.now() - 5 * 3600_000) },
    { usuarioId: valle.id, tipo: "pago_aprobado", titulo: "Pago aprobado", mensaje: "Tu reserva de la Cancha sintética quedó confirmada.", leida: true, fecha: new Date(Date.now() - 3 * 86400_000) },
  ] });

  await db.auditoria.createMany({ data: [
    { actor: "admin@udemedellin.edu.co", actorRol: "administrador", accion: "actualizar_configuracion", entidad: "configuracion", detalle: "Tarifa del Coliseo cubierto: $120.000", fecha: new Date(Date.now() - 4 * 86400_000) },
    { actor: "bienestar@udemedellin.edu.co", actorRol: "bienestar", accion: "crear_bloqueo", entidad: "bloqueos", detalle: "Cancha de voleibol: cambio de malla y demarcación", fecha: new Date(Date.now() - 2 * 86400_000) },
    { actor: "tesoreria@udemedellin.edu.co", actorRol: "tesoreria", accion: "rechazar_pago", entidad: "pagos", detalle: "El valor del comprobante no coincide", fecha: new Date(Date.now() - 5 * 3600_000) },
  ] });

  const total = await db.reserva.count();
  console.log(`Listo: ${canchas.length} canchas, ${comunidad.length + externos.length} usuarios, ${total} reservas.`);
  console.log("Contraseña de todas las cuentas de prueba: Cancha2026*");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
