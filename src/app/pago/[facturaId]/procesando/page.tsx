import { Redirigir } from "./redir";
export const metadata = { title: "Procesando pago" };
export default async function Procesando({ params, searchParams }: { params: Promise<{ facturaId: string }>; searchParams: Promise<Record<string, string>> }) {
  const { facturaId } = await params;
  const sp = await searchParams;
  const m = sp.m === "pse" ? "Conectando con tu banco" : sp.m === "nequi" || sp.m === "daviplata" ? "Esperando la aprobación en tu celular" : "Procesando tu pago";
  return (
    <div className="loader-marca" role="status" aria-live="polite">
      <div>
        <div className="balon-gira"><img src="/brand/escudo.png" alt="" /></div>
        <h1>{m}</h1>
        <p className="texto-2">No cierres ni recargues esta página.</p>
        <Redirigir a={`/pago/${facturaId}/resultado?${new URLSearchParams(sp)}`} />
      </div>
    </div>
  );
}
