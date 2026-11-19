# Reservas Deportivas Universidad de Medellín

Plataforma web para reservar las canchas polideportivas de la Universidad de Medellín por franjas de 1 hora.

- **Comunidad Universidad de Medellín** (correos `@udemedellin.edu.co` y `@soyudemedellin.edu.co`): no paga, y su reserva queda confirmada al instante.
- **Externos** (personas naturales o empresas): pagan por hora. El horario queda apartado 48 horas mientras Tesorería valida el pago.
- **Personal**: Tesorería, Bienestar Universitario · Deportes y Administrador, con acceso separado (correo y contraseña).

## Tecnología

| Capa | Herramienta |
|---|---|
| Aplicación | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Base de datos | PostgreSQL en Supabase, Prisma 6 (motor sin binarios: `queryCompiler` + `@prisma/adapter-pg`) |
| Archivos (RUT, comprobantes) | Supabase Storage (en desarrollo: `public/uploads`) |
| Correo | Nodemailer por SMTP (Office 365 u otro) |
| Sesiones | JWT firmado en cookie `httpOnly` (jose) y contraseñas con bcrypt |
| Estilos | CSS propio con los tokens del design system (Barlow Condensed + Open Sans, autoalojadas) |

## Puesta en marcha local

```bash
npm install
cp .env.example .env          # completa DATABASE_URL, DIRECT_URL y las claves de Supabase
npx prisma migrate deploy     # crea las tablas
npm run db:seed               # configuración, canchas, personal y datos de demostración
npm run dev                   # http://localhost:3000
```

Con `EMAIL_MODO="consola"` los correos no se envían: se muestran en la terminal.

### Cuentas de prueba (contraseña `Cancha2026*`)

| Rol | Correo | Entrada |
|---|---|---|
| Comunidad (estudiante) | `lmrestrepo@soyudemedellin.edu.co` | `/ingresar` |
| Externo (empresa) | `contacto@deportesdelvalle.co` | `/ingresar` |
| Externo (persona natural) | `juanpablo.ospina@gmail.com` | `/ingresar` |
| Tesorería | `tesoreria@udemedellin.edu.co` | `/personal` |
| Bienestar · Deportes | `bienestar@udemedellin.edu.co` | `/personal` |
| Administrador | `admin@udemedellin.edu.co` | `/personal` |

**Pasarela de prueba:** con la tarjeta `4242 4242 4242 4242` el pago se aprueba y con `4000 0000 0000 0002` se rechaza. Si eliges PSE, el pago queda pendiente y aparece el botón «Simular aprobación».

## Conectar Supabase

> El proyecto **Sistema-de-Reservas-Universidad-de-Medellin** (`qoseidizfcmvubwxzqwl`) ya tiene aplicadas las dos migraciones (tablas + Row Level Security), los datos de demostración y el bucket privado `documentos`. Solo falta poner las variables de entorno.
>
> Para regenerar las reservas de demostración con fechas actuales: Supabase → SQL Editor → pega `prisma/seed-demo.sql` y ejecútalo.


1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → Database → Connection string**, copia:
   - la cadena con *pooler*, puerto `6543`, en `DATABASE_URL` (agrega `?pgbouncer=true`);
   - la cadena directa, puerto `5432`, en `DIRECT_URL`.
3. Desde tu computador, ejecuta `npx prisma migrate deploy` y luego `npm run db:seed`. En producción, usa `SEED_DEMO=false npm run db:seed` para crear solo la configuración, las canchas y el personal.
4. En **Storage**, crea un bucket privado llamado `documentos`. Copia `SUPABASE_URL` y la `service_role key` en `SUPABASE_SERVICE_ROLE_KEY`. Nunca la expongas en el navegador.
5. Cambia de inmediato las contraseñas del personal sembrado, desde **Administración → Usuarios y personal**.

## Desplegar en Vercel

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. Agrega las variables de `.env.example`. En producción usa `EMAIL_MODO=smtp`, `MODO_DEMO=false`, `NEXT_PUBLIC_MODO_DEMO=false` y un `CRON_SECRET`.
3. `vercel.json` programa `/api/cron` una vez al día, a las 7:00 a. m. de Bogotá. Esa tarea vence las reservas sin pago y envía los recordatorios de las reservas del día siguiente. Las reservas también se vencen automáticamente cada vez que alguien consulta la disponibilidad.

## Mockups en Figma

Las pantallas son la app real, así que el diseño y el código no se desfasan:

1. Instala el plugin **html.to.design** en Figma.
2. Para las páginas públicas, pega la URL desplegada (`/`, `/escenarios`, `/registro`…), una vez a 1440 px y otra a 390 px.
3. Para las pantallas con sesión (portal, pasarela, paneles), usa la extensión de Chrome de html.to.design. Ingresa con una cuenta de prueba e importa la pestaña abierta.
4. Correos: `/correos` lista las 11 plantillas, y `/correos/<plantilla>` devuelve el HTML de 600 px.
5. El design system también está en `/design-system.html`.

Para organizar las páginas de Figma: 00 Portada · 01 Design System · 02 Públicas · 03 Autenticación · 04 Portal usuario · 05 Pasarela de pagos · 06 Tesorería · 07 Bienestar · 08 Administrador · 09 Correos · 10 Estados del sistema.

## Mapa de pantallas

| Bloque | Rutas |
|---|---|
| Públicas | `/` · `/escenarios` · `/escenarios/[slug]` · `/ayuda` · `/reglamento` · `/terminos` |
| Autenticación | `/registro` · `/registro/comunidad` · `/registro/externo` · `/ingresar` · `/personal` |
| Portal | `/portal` · `/portal/reservar` → `/datos` → `/confirmar` · `/portal/reservas/[codigo]/lista` · `/portal/reservas` · `/portal/reservas/[codigo]` · `/portal/avisos` · `/portal/perfil` · `/portal/pagos` |
| Pasarela | `/pago/[id]` · `/metodo` · `/tarjeta` · `/pse` · `/billetera` · `/transferencia` · `/procesando` · `/resultado` · `/comprobante` · `/factura/[numero]` |
| Tesorería | `/tesoreria` · `/tesoreria/pagos` (drawer con comprobante) · `/tesoreria/caja` · `/tesoreria/facturas` · `/tesoreria/facturas/[numero]` |
| Bienestar | `/bienestar` · `/bienestar/calendario` (día, semana, mes) · `/bienestar/reservas` · `/bienestar/reservas/[codigo]` · `/bienestar/canchas` · `/bienestar/reportes` |
| Administrador | `/admin/usuarios` · `/admin/configuracion` · `/admin/auditoria` · `/correos` |
| Estados | 404 · error 500 · `/mantenimiento` · `/sin-conexion` · `/estados` (catálogo) · banner de cookies · toasts |
| API | `/api/calendario/[codigo]` (.ics) · `/api/exportar` (CSV y Excel) · `/api/cron` |

## Modelo de datos

Está en `prisma/schema.prisma`, con los nombres en español del modelo de referencia: `usuarios`, `personal`, `datos_facturacion`, `canchas`, `bloqueos`, `reservas`, `facturas`, `pagos`, `codigos_verificacion`, `notificaciones`, `auditoria` y `configuracion`.

Estados de reserva: `confirmada`, `pendiente_pago`, `en_validacion`, `rechazada`, `vencida`, `cancelada`, `asistio` y `no_asistio`. Los estados `libre` y `fuera_de_servicio` se calculan a partir de las reservas, los bloqueos y el estado de la cancha. Un índice único parcial impide la doble reserva de una misma franja.

## Pendientes antes de producción

- **Pasarela real:** la pasarela actual es una simulación. Reemplaza las acciones `pagarConTarjeta`, `pagarConPse` y `pagarConBilletera` en `src/lib/acciones-portal.ts` por la integración con Wompi, PayU o ePayco, y recibe la confirmación por webhook.
- **Factura electrónica:** la factura de la plataforma es un soporte de pago. La factura electrónica oficial la expide la Universidad ante la DIAN.
- **Datos institucionales:** valida con la Universidad las tarifas, los datos bancarios, el NIT y los textos legales (reglamento, términos y política de datos).
- **Fotos:** reemplaza las ilustraciones de canchas por fotos reales con la clase `.duotono`.
