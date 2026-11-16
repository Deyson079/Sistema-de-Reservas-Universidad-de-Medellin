-- Activa Row Level Security en todas las tablas: bloquea el acceso por la API pública de Supabase (anon/authenticated).
-- La aplicación se conecta como propietaria de las tablas (rol postgres) y no se ve afectada.
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "personal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "datos_facturacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "canchas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bloqueos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reservas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "facturas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pagos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "codigos_verificacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notificaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "configuracion" ENABLE ROW LEVEL SECURITY;
