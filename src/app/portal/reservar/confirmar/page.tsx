import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, Ban, Hourglass, IdCard, ShieldCheck } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { reservar } from "@/lib/acciones-portal";
import { Stepper } from "@/components/ui/Varios";
import { BotonEnviar } from "@/components/ui/Cliente";
import { ResumenReserva } from "@/components/portal/ResumenReserva";

export const metadata = { title: "Confirmar reserva" };

export default async function Confirmar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const u = await requireUsuario();
  const cfg = await getConfig();
  const cancha = await db.cancha.findUnique({ where: { slug: sp.cancha ?? "" } });
  const hora = Number(sp.hora);
  if (!cancha || !sp.fecha || Number.isNaN(hora)) redirect("/portal/reservar");
  const ext = u.tipo === "externo";
  const atras = `/portal/reservar/datos?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])}`;
  return (
    <>
      <div className="reservar-cab"><div className="contenedor">
        <Link href={atras} className="miga mt-2"><ArrowLeft className="i i-sm" />Editar datos</Link>
        <div className="pag-cab" style={{ margin: "4px 0 0" }}><div><h1>Revisa y confirma</h1><p>Verifica que todo esté bien antes de {ext ? "apartar el horario" : "confirmar"}.</p></div></div>
        <Stepper paso={3} pasos={["Elige cancha y franja", "Datos de la reserva", "Confirmar"]} />
      </div></div>
      <div className="contenedor grid-principal mt-4">
        <form action={reservar} className="tarjeta form">
          {(["cancha", "fecha", "hora"] as const).map(() => null)}
          <input type="hidden" name="canchaId" value={cancha.id} /><input type="hidden" name="fecha" value={sp.fecha} /><input type="hidden" name="hora" value={hora} />
          <input type="hidden" name="actividad" value={sp.actividad ?? cancha.deportes[0]} /><input type="hidden" name="participantes" value={sp.participantes ?? "10"} /><input type="hidden" name="observaciones" value={sp.observaciones ?? ""} />
          <h2 className="t-h4" style={{ margin: 0 }}>Tu reserva</h2>
          <dl className="dl">
            <dt>Actividad</dt><dd>{sp.actividad}</dd>
            <dt>Participantes</dt><dd>{sp.participantes} personas</dd>
            {sp.observaciones && <><dt>Observaciones</dt><dd style={{ fontWeight: 400 }}>{sp.observaciones}</dd></>}
            <dt>Reserva a nombre de</dt><dd>{u.nombres} {u.apellidos}</dd>
            {ext && u.facturacion && <><dt>Factura a</dt><dd>{u.facturacion.razonSocial} · {u.facturacion.nitCedula}</dd></>}
          </dl>
          <h2 className="t-h4" style={{ margin: "8px 0 0" }}>Políticas</h2>
          <ul className="politicas">
            {ext ? <li><Hourglass className="i" />Tu horario queda apartado {cfg.horasParaPagar} horas mientras pagas. Si no pagas a tiempo, la reserva vence y la franja se libera.</li>
              : <li><Check className="i" />Es sin costo y queda confirmada al instante.</li>}
            {ext && <li><ShieldCheck className="i" />La reserva se confirma cuando Tesorería valida tu pago.</li>}
            <li><Ban className="i" />Puedes cancelar sin penalidad hasta {cfg.horasCancelacion} horas antes de la franja.</li>
            <li><IdCard className="i" />Presenta el código QR y tu documento en la entrada.</li>
            <li><Clock className="i" />Llega 10 minutos antes. La franja termina a la hora exacta.</li>
          </ul>
          <label className="check"><input type="checkbox" name="acepto" required /><span>Leí y acepto el <Link href="/reglamento" target="_blank">reglamento de uso</Link> de los escenarios.</span></label>
          <div className="fila-entre"><Link href={atras} className="btn btn-fantasma"><ArrowLeft className="i" />Atrás</Link><BotonEnviar className="btn btn-primario btn-lg" pendiente="Reservando…">{ext ? "Apartar horario y generar factura" : "Confirmar reserva"}</BotonEnviar></div>
        </form>
        <ResumenReserva cancha={cancha} fecha={sp.fecha} hora={hora} externo={ext} iva={cfg.ivaPorcentaje} />
      </div>
    </>
  );
}
