// Migra a Supabase Auth las cuentas de usuarios y personal que aún no están enlazadas.
// Ejecuta: npm run auth:migrar   (se puede repetir sin problema)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sincronizarAuth } from "../prisma/sincronizar-auth";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

sincronizarAuth(db)
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
