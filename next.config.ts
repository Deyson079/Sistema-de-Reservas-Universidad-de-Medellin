import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
