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
};

export default nextConfig;
