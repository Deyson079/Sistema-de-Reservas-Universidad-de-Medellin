import type { Cancha } from "@prisma/client";
import { fechaLarga } from "@/lib/formato";

export function FiltrosPanel({ accion, f, canchas }: { accion: string; f: { periodo: string; desde: string; hasta: string; cancha?: string; tipoUsuario?: string }; canchas: Cancha[] }) {
  return (
    <form className="barra-filtros" action={accion}>
      <div className="campo"><label htmlFor="periodo">Periodo</label><select id="periodo" name="periodo" defaultValue={f.periodo} className="input"><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="proximos">Próximos 14 días</option><option value="personalizado">Personalizado</option></select></div>
      <div className="campo" style={{ minWidth: 150 }}><label htmlFor="desde">Desde</label><input id="desde" name="desde" type="date" defaultValue={f.desde} className="input" /></div>
      <div className="campo" style={{ minWidth: 150 }}><label htmlFor="hasta">Hasta</label><input id="hasta" name="hasta" type="date" defaultValue={f.hasta} className="input" /></div>
      <div className="campo"><label htmlFor="cancha">Cancha</label><select id="cancha" name="cancha" defaultValue={f.cancha ?? ""} className="input"><option value="">Todas</option>{canchas.map((c) => <option key={c.id} value={c.slug}>{c.nombre}</option>)}</select></div>
      <div className="campo"><label htmlFor="tipo">Tipo de usuario</label><select id="tipo" name="tipo" defaultValue={f.tipoUsuario ?? ""} className="input"><option value="">Todos</option><option value="comunidad">Comunidad</option><option value="externo">Externos</option></select></div>
      <button className="btn btn-secundario" style={{ height: 44 }}>Aplicar</button>
      <span className="resumen-f">Del {fechaLarga(f.desde)} al {fechaLarga(f.hasta)}</span>
    </form>
  );
}
