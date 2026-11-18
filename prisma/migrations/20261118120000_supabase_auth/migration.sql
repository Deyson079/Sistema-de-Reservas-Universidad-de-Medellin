-- Enlaza usuarios y personal con Supabase Auth (auth.users.id).
-- password_hash queda opcional: solo se usa para migrar las cuentas existentes a Supabase Auth.
ALTER TABLE "usuarios" ADD COLUMN "auth_id" TEXT;
ALTER TABLE "usuarios" ALTER COLUMN "password_hash" DROP NOT NULL;
CREATE UNIQUE INDEX "usuarios_auth_id_key" ON "usuarios"("auth_id");

ALTER TABLE "personal" ADD COLUMN "auth_id" TEXT;
ALTER TABLE "personal" ALTER COLUMN "password_hash" DROP NOT NULL;
CREATE UNIQUE INDEX "personal_auth_id_key" ON "personal"("auth_id");
