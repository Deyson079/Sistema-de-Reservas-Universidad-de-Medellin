"use client";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { crearBloqueo } from "@/lib/acciones-staff";
import type { Estado } from "@/lib/acciones-auth";
import { Campo, Seleccion } from "@/components/ui/Campo";
import { BotonEnviar } from "@/components/ui/Cliente";

export function FormBloqueo({ canchas, hoy }: { canchas: Array<{ id: string; nombre: string }>; hoy: string }) {
  const [e, a] = useActionState<Estado, FormData>(crearBloqueo, undefined);
  const c = e?.campos ?? {};
  const horas = Array.from({ length: 25 }, (_, h) => h);
  const fh = (h: number) => (h === 24 ? "12:00 a. m. (fin del día)" : `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "a. m." : "p. m."}`);
  return (
    <form action={a} className="form" key={e?.ok ? String(Date.now()) : "f"}>
      {e?.ok && <div className="aviso aviso--exito" role="status"><CircleCheck className="i" /><span>{e.tipo}</span></div>}
      <div className="form-grid">
        <Seleccion etiqueta="Escenario" name="canchaId" error={c.canchaId} required full>{canchas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</Seleccion>
        <Seleccion etiqueta="Tipo" name="tipo"><option value="mantenimiento">Fuera de servicio (mantenimiento)</option><option value="evento">Evento institucional</option></Seleccion>
        <Campo etiqueta="Motivo" name="motivo" error={c.motivo} placeholder="Ej.: Juegos Interfacultades" required />
        <Campo etiqueta="Desde" name="desde" type="date" min={hoy} defaultValue={hoy} error={c.desde} required />
        <Seleccion etiqueta="Hora inicial" name="horaDesde" defaultValue="6">{horas.slice(0, 24).map((h) => <option key={h} value={h}>{fh(h)}</option>)}</Seleccion>
        <Campo etiqueta="Hasta" name="hasta" type="date" min={hoy} defaultValue={hoy} error={c.hasta} required />
        <Seleccion etiqueta="Hora final" name="horaHasta" defaultValue="22">{horas.slice(1).map((h) => <option key={h} value={h}>{fh(h)}</option>)}</Seleccion>
      </div>
      <p className="chico texto-2" style={{ margin: 0 }}>Las reservas que caigan en este rango se cancelan y cada usuario recibe un aviso con el motivo.</p>
      <div><BotonEnviar>Crear bloqueo</BotonEnviar></div>
    </form>
  );
}
