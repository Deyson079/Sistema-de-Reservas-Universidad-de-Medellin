import { FormIngresar } from "./formulario";
export const metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  const { siguiente } = await searchParams;
  return (
    <>
      <h1>Ingresa</h1>
      <p className="intro">Con el correo y la contraseña de tu cuenta de Reservas Deportivas.</p>
      <FormIngresar siguiente={siguiente} demo={process.env.MODO_DEMO === "true"} />
    </>
  );
}
