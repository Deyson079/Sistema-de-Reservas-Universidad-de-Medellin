import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer"],
  // Prisma (queryCompiler) lee query_compiler_bg.wasm con fs en tiempo de ejecución,
  // así que el trazado de Next no lo detecta: hay que incluirlo a mano en las funciones de Vercel.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*"],
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  poweredByHeader: false,
  compress: true,
  // Se retiraron todos los códigos por correo (doble factor del personal, verificación del correo y
  // recuperación de contraseña): los enlaces antiguos llevan a la pantalla que corresponde
  async redirects() {
    return [
      { source: "/personal/verificar", destination: "/personal", permanent: false },
      { source: "/verificar", destination: "/ingresar", permanent: false },
      { source: "/recuperar/:paso*", destination: "/ayuda", permanent: false },
    ];
  },
  // Logos y escudos casi nunca cambian: el navegador los guarda una semana y los revalida en segundo plano
  async headers() {
    return [
      { source: "/brand/:archivo*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
