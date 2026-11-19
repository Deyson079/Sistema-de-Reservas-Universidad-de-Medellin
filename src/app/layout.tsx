import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
// Solo el subconjunto latino (cubre español: tildes, ñ, ¿¡): CSS más liviano que cargar los 9 alfabetos
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-600.css";
import "@fontsource/open-sans/latin-700.css";
import "./globals.css";
import { BannerCookies, ToastUrl } from "@/components/ui/Cliente";

export const metadata: Metadata = {
  title: { default: "Reservas Deportivas Universidad de Medellín", template: "%s · Reservas Deportivas Universidad de Medellín" },
  description: "Reserva por horas las canchas polideportivas de la Universidad de Medellín.",
  icons: { icon: "/brand/escudo.png" },
};
export const viewport: Viewport = { themeColor: "#C2262B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>
        {children}
        <Suspense><ToastUrl /></Suspense>
        <BannerCookies />
      </body>
    </html>
  );
}
