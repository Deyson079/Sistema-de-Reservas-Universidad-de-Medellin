import Link from "next/link";
import { Plus, Pencil, X, Megaphone, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { moneda } from "@/lib/formato";
import { avisoMasivo } from "@/lib/acciones-staff";
import { Tabs } from "@/components/ui/Varios";
import { BotonEnviar } from "@/components/ui/Cliente";
import { FormConfig, FormCancha } from "./formularios";

export const dynamic = "force-dynamic";

export default async function Configuracion({ searchParams }: { searchParams: Promise<{ tab?: string; cancha?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "general";
  const [cfg, canchas] = await Promise.all([getConfig(), db.cancha.findMany({ orderBy: { orden: "asc" } })]);
  const sel = sp.cancha && sp.cancha !== "nueva" ? canchas.find((c) => c.id === sp.cancha) : undefined;
  return (
    <>
      <div className="pag-cab"><div><h1>Configuración</h1><p>Reglas de reserva, canchas, tarifas, dominios, datos bancarios y textos.</p></div></div>
      <Tabs activo={tab} items={[{ id: "general", texto: "General", href: "/admin/configuracion" }, { id: "canchas", texto: "Canchas y tarifas", href: "/admin/configuracion?tab=canchas", cuenta: canchas.length }, { id: "avisos", texto: "Avisos y correos", href: "/admin/configuracion?tab=avisos" }]} />
      <div className="mt-3">
        {tab === "general" && <FormConfig c={cfg} />}
        {tab === "canchas" && (
          <div className={sp.cancha ? "grid-principal" : ""}>
            <div className="tabla-wrap"><table className="t t-resp">
              <thead><tr><th>Cancha</th><th>Deportes</th><th>Capacidad</th><th className="num">Tarifa externos</th><th /></tr></thead>
              <tbody>{canchas.map((c) => <tr key={c.id}><td data-label="Cancha" className="full"><b>{c.nombre}</b><br /><small className="nota">{c.dimensiones}</small></td><td data-label="Deportes">{c.deportes.join(", ")}</td><td data-label="Capacidad">{c.capacidad}</td><td className="num t-num" data-label="Tarifa" style={{ fontSize: 18 }}>{moneda(c.tarifaHora, false)}</td><td data-label="" className="full"><Link className="btn btn-fantasma btn-sm" href={`/admin/configuracion?tab=canchas&cancha=${c.id}`}><Pencil className="i i-sm" />Editar</Link></td></tr>)}</tbody>
            </table>
              <div style={{ padding: 16 }}><Link href="/admin/configuracion?tab=canchas&cancha=nueva" className="btn btn-secundario"><Plus className="i" />Nueva cancha</Link></div></div>
            {sp.cancha && <aside className="tarjeta"><div className="fila-entre" style={{ marginBottom: 12 }}><h2 className="t-h4" style={{ margin: 0 }}>{sel ? sel.nombre : "Nueva cancha"}</h2><Link href="/admin/configuracion?tab=canchas" className="cerrar" aria-label="Cerrar"><X className="i" /></Link></div><FormCancha key={sel?.id ?? "nueva"} c={sel} /></aside>}
          </div>
        )}
        {tab === "avisos" && (
          <div className="grid-2">
            <form action={avisoMasivo} className="tarjeta form">
              <h2 className="t-h4" style={{ margin: 0 }}><Megaphone className="i" style={{ display: "inline", verticalAlign: -3 }} /> Aviso a todos los usuarios</h2>
              <p className="chico texto-2" style={{ margin: 0 }}>Aparece en el centro de Avisos de cada usuario activo.</p>
              <div className="campo"><label htmlFor="titulo">Título</label><input id="titulo" name="titulo" className="input" required maxLength={80} placeholder="Ej.: Cierre por Semana Universitaria" /></div>
              <div className="campo"><label htmlFor="mensaje">Mensaje</label><textarea id="mensaje" name="mensaje" className="input" required maxLength={300} /></div>
              <div><BotonEnviar>Enviar aviso</BotonEnviar></div>
            </form>
            <div className="tarjeta"><h2 className="t-h4" style={{ margin: 0 }}><Mail className="i" style={{ display: "inline", verticalAlign: -3 }} /> Plantillas de correo</h2><p className="chico texto-2">Revisa cómo se ven los 11 correos transaccionales con la marca de la Universidad de Medellín.</p><Link href="/correos" className="btn btn-secundario">Ver plantillas</Link></div>
          </div>
        )}
      </div>
    </>
  );
}
