"use client";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { guardarConfiguracion, guardarCancha } from "@/lib/acciones-staff";
import type { Estado } from "@/lib/acciones-auth";
import type { Config } from "@/lib/config";
import { Campo, Seleccion, Area } from "@/components/ui/Campo";
import { BotonEnviar } from "@/components/ui/Cliente";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const H = Array.from({ length: 25 }, (_, h) => h);
const fh = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 || h === 24 ? "a. m." : "p. m."}`;

export function FormConfig({ c }: { c: Config }) {
  const [e, a] = useActionState<Estado, FormData>(guardarConfiguracion, undefined);
  const x = e?.campos ?? {};
  const Bloque = ({ t, d, children }: { t: string; d?: string; children: React.ReactNode }) => <fieldset className="tarjeta" style={{ margin: 0 }}><legend className="t-h4" style={{ padding: 0, float: "left", width: "100%", marginBottom: d ? 2 : 16 }}>{t}</legend>{d && <p className="chico texto-2" style={{ clear: "both", margin: "0 0 16px" }}>{d}</p>}<div style={{ clear: "both" }}>{children}</div></fieldset>;
  return (
    <form action={a} className="form" style={{ gap: 16 }}>
      {e?.ok && <div className="aviso aviso--exito" role="status"><CircleCheck className="i" /><span>{e.tipo}</span></div>}
      <Bloque t="Horario de franjas y reglas" d="Cada franja dura 1 hora.">
        <div className="grid-3">
          <Seleccion etiqueta="Primera franja" name="horaApertura" defaultValue={String(c.horaApertura)}>{H.slice(0, 24).map((h) => <option key={h} value={h}>{fh(h)}</option>)}</Seleccion>
          <Seleccion etiqueta="Cierre" name="horaCierre" defaultValue={String(c.horaCierre)} error={x.horaCierre}>{H.slice(1).map((h) => <option key={h} value={h}>{fh(h)}</option>)}</Seleccion>
          <Campo etiqueta="Días de anticipación" name="diasAnticipacion" type="number" min={1} max={60} defaultValue={c.diasAnticipacion} />
          <Campo etiqueta="Horas para pagar (externos)" name="horasParaPagar" type="number" min={1} max={168} defaultValue={c.horasParaPagar} />
          <Campo etiqueta="Máximo de franjas por día" name="maxFranjasDia" type="number" min={1} max={8} defaultValue={c.maxFranjasDia} />
          <Campo etiqueta="Cancelar sin penalidad (horas antes)" name="horasCancelacion" type="number" min={0} max={72} defaultValue={c.horasCancelacion} />
          <Campo etiqueta="IVA (%)" name="ivaPorcentaje" type="number" min={0} max={19} defaultValue={c.ivaPorcentaje} ayuda="0 si no aplica." />
        </div>
        <div className="mt-2"><span className="negrita chico">Días de servicio</span><div className="fila mt-1">{DIAS.map((d, i) => <label key={d} className="check" style={{ padding: 0, minHeight: 36 }}><input type="checkbox" name="diasServicio" value={i} defaultChecked={c.diasServicio.includes(i)} />{d}</label>)}</div></div>
      </Bloque>
      <Bloque t="Dominios institucionales" d="Los correos con estos dominios se registran como comunidad y no pagan.">
        <Campo etiqueta="Dominios (separados por comas)" name="dominios" defaultValue={c.dominios.join(", ")} error={x.dominios} />
      </Bloque>
      <Bloque t="Datos bancarios" d="Se muestran a los externos que pagan por transferencia o consignación.">
        <div className="grid-3">
          <Campo etiqueta="Banco" name="banco" defaultValue={c.datosBancarios.banco} /><Campo etiqueta="Tipo de cuenta" name="tipoCuenta" defaultValue={c.datosBancarios.tipoCuenta} /><Campo etiqueta="Número de cuenta" name="numero" defaultValue={c.datosBancarios.numero} />
          <Campo etiqueta="Titular" name="titular" defaultValue={c.datosBancarios.titular} /><Campo etiqueta="NIT" name="nit" defaultValue={c.datosBancarios.nit} /><Campo etiqueta="Convenio de recaudo" name="convenio" defaultValue={c.datosBancarios.convenio} />
        </div>
      </Bloque>
      <Bloque t="Textos de contacto" d="Aparecen en el pie de página, la ayuda y los correos.">
        <div className="grid-2"><Campo etiqueta="Correo" name="cCorreo" defaultValue={c.contacto.correo} /><Campo etiqueta="Teléfono" name="cTelefono" defaultValue={c.contacto.telefono} /><Campo etiqueta="Dirección" name="cDireccion" defaultValue={c.contacto.direccion} /><Campo etiqueta="Horario de los escenarios" name="cHorario" defaultValue={c.contacto.horario} /></div>
      </Bloque>
      <div style={{ position: "sticky", bottom: 16, zIndex: 5 }}><BotonEnviar className="btn btn-primario btn-lg">Guardar configuración</BotonEnviar></div>
    </form>
  );
}

export function FormCancha({ c }: { c?: { id: string; nombre: string; deportes: string[]; capacidad: number; dimensiones: string; tarifaHora: number; ubicacion: string; descripcion: string; servicios: string[]; ilustracion: string } }) {
  const [e, a] = useActionState<Estado, FormData>(guardarCancha, undefined);
  const x = e?.campos ?? {};
  return (
    <form action={a} className="form">
      {e?.ok && <div className="aviso aviso--exito" role="status"><CircleCheck className="i" /><span>{e.tipo}</span></div>}
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="form-grid">
        <Campo etiqueta="Nombre" name="nombre" defaultValue={c?.nombre} error={x.nombre} required />
        <Campo etiqueta="Deportes (separados por comas)" name="deportes" defaultValue={c?.deportes.join(", ")} error={x.deportes} required />
        <Campo etiqueta="Capacidad (personas)" name="capacidad" type="number" min={1} defaultValue={c?.capacidad} error={x.capacidad} required />
        <Campo etiqueta="Dimensiones" name="dimensiones" defaultValue={c?.dimensiones} placeholder="40 × 22 m" error={x.dimensiones} required />
        <Campo etiqueta="Tarifa por hora para externos (COP)" name="tarifaHora" type="number" min={0} step={1000} defaultValue={c?.tarifaHora} error={x.tarifaHora} required />
        <Seleccion etiqueta="Ilustración (mientras llegan las fotos)" name="ilustracion" defaultValue={c?.ilustracion ?? "placa"}><option value="baloncesto">Coliseo / baloncesto</option><option value="futbol">Fútbol</option><option value="placa">Placa polideportiva</option><option value="voleibol">Voleibol</option></Seleccion>
        <Campo etiqueta="Ubicación en el campus" name="ubicacion" defaultValue={c?.ubicacion} full />
        <Campo etiqueta="Servicios (separados por comas)" name="servicios" defaultValue={c?.servicios.join(", ")} full />
        <Area etiqueta="Descripción" name="descripcion" defaultValue={c?.descripcion} full />
      </div>
      <div><BotonEnviar>{c ? "Guardar cancha" : "Crear cancha"}</BotonEnviar></div>
    </form>
  );
}
