
-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('comunidad', 'externo');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('estudiante', 'docente', 'administrativo', 'egresado', 'externo');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('activo', 'bloqueado', 'eliminado');

-- CreateEnum
CREATE TYPE "RolPersonal" AS ENUM ('tesoreria', 'bienestar', 'administrador');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('natural', 'juridica');

-- CreateEnum
CREATE TYPE "EstadoCancha" AS ENUM ('activa', 'fuera_de_servicio');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('confirmada', 'pendiente_pago', 'en_validacion', 'rechazada', 'vencida', 'cancelada', 'asistio', 'no_asistio');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('sin_pagar', 'pagada', 'vencida', 'anulada');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('tarjeta', 'pse', 'nequi', 'daviplata', 'transferencia', 'caja');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'en_validacion', 'validado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoCodigo" AS ENUM ('registro', 'recuperacion', 'doble_factor', 'cambio_correo');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL DEFAULT '',
    "tipo_documento" TEXT NOT NULL DEFAULT 'CC',
    "documento" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "correo_verificado" BOOLEAN NOT NULL DEFAULT false,
    "celular" TEXT NOT NULL,
    "programa" TEXT,
    "password_hash" TEXT NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'activo',
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "preferencias" JSONB NOT NULL DEFAULT '{"correo":true,"recordatorio":true}',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal" (
    "id" TEXT NOT NULL,
    "rol" "RolPersonal" NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_ingreso" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datos_facturacion" (
    "usuario_id" TEXT NOT NULL,
    "tipo_persona" "TipoPersona" NOT NULL,
    "nit_cedula" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "rut_url" TEXT,

    CONSTRAINT "datos_facturacion_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "canchas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "deportes" TEXT[],
    "capacidad" INTEGER NOT NULL,
    "dimensiones" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "ubicacion" TEXT NOT NULL DEFAULT '',
    "servicios" TEXT[],
    "fotos" TEXT[],
    "ilustracion" TEXT NOT NULL DEFAULT 'placa',
    "tarifa_hora" INTEGER NOT NULL,
    "estado" "EstadoCancha" NOT NULL DEFAULT 'activa',
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueos" (
    "id" TEXT NOT NULL,
    "cancha_id" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'mantenimiento',
    "creado_por" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "cancha_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" INTEGER NOT NULL,
    "hora_fin" INTEGER NOT NULL,
    "actividad" TEXT NOT NULL,
    "participantes" INTEGER NOT NULL,
    "observaciones" TEXT,
    "estado" "EstadoReserva" NOT NULL,
    "limite_pago" TIMESTAMP(3),
    "motivo_cancelacion" TEXT,
    "cancelada_por" TEXT,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "iva" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'sin_pagar',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vence_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "banco" TEXT,
    "comprobante_url" TEXT,
    "valor" INTEGER NOT NULL,
    "fecha_pago" DATE,
    "estado" "EstadoPago" NOT NULL,
    "validado_por" TEXT,
    "validado_en" TIMESTAMP(3),
    "motivo_rechazo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_verificacion" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoCodigo" NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actor_rol" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "personal_correo_key" ON "personal"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "canchas_slug_key" ON "canchas"("slug");

-- CreateIndex
CREATE INDEX "bloqueos_cancha_id_desde_hasta_idx" ON "bloqueos"("cancha_id", "desde", "hasta");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_codigo_key" ON "reservas"("codigo");

-- CreateIndex
CREATE INDEX "reservas_cancha_id_fecha_idx" ON "reservas"("cancha_id", "fecha");

-- CreateIndex
CREATE INDEX "reservas_usuario_id_estado_idx" ON "reservas"("usuario_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_reserva_id_key" ON "facturas"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_key" ON "facturas"("numero");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE INDEX "codigos_verificacion_correo_tipo_idx" ON "codigos_verificacion"("correo", "tipo");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_idx" ON "notificaciones"("usuario_id", "leida");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- AddForeignKey
ALTER TABLE "datos_facturacion" ADD CONSTRAINT "datos_facturacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "personal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Evita dobles reservas de la misma franja (solo cuentan las reservas activas)
CREATE UNIQUE INDEX "reservas_franja_activa_unica" ON "reservas" ("cancha_id", "fecha", "hora_inicio")
  WHERE "estado" IN ('confirmada', 'pendiente_pago', 'en_validacion', 'asistio', 'no_asistio');
