import { db } from "./db";

export type Config = {
  horaApertura: number;
  horaCierre: number;
  diasServicio: number[]; // 0 = domingo
  diasAnticipacion: number;
  horasParaPagar: number;
  maxFranjasDia: number;
  horasCancelacion: number;
  ivaPorcentaje: number;
  dominios: string[];
  datosBancarios: { banco: string; tipoCuenta: string; numero: string; titular: string; nit: string; convenio: string };
  contacto: { correo: string; telefono: string; direccion: string; horario: string };
  nitUniversidad: string;
};

export const CONFIG_POR_DEFECTO: Config = {
  horaApertura: 6,
  horaCierre: 22,
  diasServicio: [1, 2, 3, 4, 5, 6],
  diasAnticipacion: 14,
  horasParaPagar: 48,
  maxFranjasDia: 2,
  horasCancelacion: 6,
  ivaPorcentaje: 0,
  dominios: ["udemedellin.edu.co", "soyudemedellin.edu.co"],
  datosBancarios: {
    banco: "Bancolombia",
    tipoCuenta: "Cuenta corriente",
    numero: "000-000000-00",
    titular: "Universidad de Medellín",
    nit: "890.902.920-1",
    convenio: "00000",
  },
  contacto: {
    correo: "deportes@udemedellin.edu.co",
    telefono: "(604) 340 5555",
    direccion: "Carrera 87 N.° 30-65, Belén Los Alpes, Medellín",
    horario: "Lunes a sábado, 6:00 a. m. a 10:00 p. m.",
  },
  nitUniversidad: "890.902.920-1",
};

export async function getConfig(): Promise<Config> {
  try {
    const filas = await db.configuracion.findMany();
    const c: Record<string, unknown> = { ...CONFIG_POR_DEFECTO };
    for (const f of filas) c[f.clave] = f.valor;
    return c as Config;
  } catch {
    return CONFIG_POR_DEFECTO;
  }
}

export async function setConfig(clave: keyof Config, valor: unknown) {
  await db.configuracion.upsert({
    where: { clave },
    create: { clave, valor: valor as never },
    update: { valor: valor as never },
  });
}

export function esCorreoInstitucional(correo: string, dominios: string[]) {
  const d = correo.trim().toLowerCase().split("@")[1] ?? "";
  return dominios.includes(d);
}
