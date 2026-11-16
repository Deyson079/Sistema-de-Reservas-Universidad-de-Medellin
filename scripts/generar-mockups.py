"""Genera una copia estática navegable de toda la plataforma (HTML + CSS, sin JavaScript) para GitHub Pages."""
import asyncio, os, re, shutil, subprocess, sys
from urllib.parse import urlsplit
from playwright.async_api import async_playwright

B = "http://localhost:3000"
OUT = sys.argv[1]
APP = "/home/claude/app"

def q(sql):
    r = subprocess.run(["psql", "-h", "localhost", "-U", "udem", "-d", "reservas", "-t", "-A", "-c", sql], capture_output=True, text=True, env={**os.environ, "PGPASSWORD": "udem"})
    return r.stdout.strip().split("\n")[0]

LAURA = "lmrestrepo@soyudemedellin.edu.co"; VALLE = "contacto@deportesdelvalle.co"
l_conf = q(f"select r.codigo from reservas r join usuarios u on u.id=r.usuario_id where u.correo='{LAURA}' and r.estado='confirmada' and r.fecha>=current_date order by r.fecha, r.hora_inicio limit 1")
l_asis = q(f"select r.codigo from reservas r join usuarios u on u.id=r.usuario_id where u.correo='{LAURA}' and r.estado='asistio' order by r.fecha desc limit 1")
l_canc = q(f"select r.codigo from reservas r join usuarios u on u.id=r.usuario_id where u.correo='{LAURA}' and r.estado='cancelada' order by r.fecha desc limit 1")
v_pend = q(f"select r.codigo||'|'||f.id||'|'||f.numero from reservas r join usuarios u on u.id=r.usuario_id join facturas f on f.reserva_id=r.id where u.correo='{VALLE}' and r.estado='pendiente_pago' order by r.limite_pago desc limit 1").split("|")
v_rech = q(f"select r.codigo from reservas r join usuarios u on u.id=r.usuario_id where u.correo='{VALLE}' and r.estado='rechazada' limit 1")
v_conf = q(f"select r.codigo||'|'||f.numero from reservas r join usuarios u on u.id=r.usuario_id join facturas f on f.reserva_id=r.id where u.correo='{VALLE}' and r.estado='confirmada' and f.estado='pagada' order by r.fecha desc limit 1").split("|")
v_valid = q(f"select r.codigo from reservas r join usuarios u on u.id=r.usuario_id where u.correo='{VALLE}' and r.estado='en_validacion' limit 1")
pago_val = q("select p.id from pagos p where p.estado='en_validacion' and p.comprobante_url is not null order by p.fecha limit 1")
fac_num = q("select numero from facturas f join pagos p on p.factura_id=f.id where p.estado='validado' order by f.creada_en desc limit 1")
b_res = q("select codigo from reservas where estado='confirmada' and fecha>=current_date order by fecha, hora_inicio limit 1")
b_past = q("select codigo from reservas where estado='asistio' order by fecha desc limit 1")
hoy = q("select (now() at time zone 'America/Bogota')::date")
cancha_q = f"cancha=coliseo-cubierto&fecha={hoy}"
hora_libre = q(f"select h from generate_series(6,21) h where h > extract(hour from now() at time zone 'America/Bogota') + 1 and not exists (select 1 from reservas r join canchas c on c.id=r.cancha_id where c.slug='placa-polideportiva-1' and r.fecha=(now() at time zone 'America/Bogota')::date + 1 and r.hora_inicio=h and r.estado in ('confirmada','pendiente_pago','en_validacion')) limit 1") or "15"
manana = q("select ((now() at time zone 'America/Bogota')::date + 1)")
sel = f"cancha=placa-polideportiva-1&fecha={manana}&hora={hora_libre}"
print("datos:", l_conf, v_pend, pago_val, fac_num, b_res, sel)

# rol -> lista de (url, titulo, grupo Figma)
P = "publico"
RUTAS = {
  "publico": [
    ("/", "Inicio (landing)", "02 Públicas"), ("/escenarios", "Escenarios", "02 Públicas"),
    ("/escenarios/coliseo-cubierto", "Detalle: Coliseo cubierto", "02 Públicas"), ("/escenarios/cancha-sintetica", "Detalle: Cancha sintética", "02 Públicas"),
    ("/escenarios/placa-polideportiva-1", "Detalle: Placa polideportiva 1", "02 Públicas"), ("/escenarios/cancha-de-voleibol", "Detalle: Cancha de voleibol", "02 Públicas"),
    ("/ayuda", "Ayuda y preguntas frecuentes", "02 Públicas"), ("/reglamento", "Reglamento de uso", "02 Públicas"), ("/terminos", "Términos y política de datos", "02 Públicas"),
    ("/registro", "Elegir tipo de cuenta", "03 Autenticación"), ("/registro/comunidad", "Registro comunidad", "03 Autenticación"), ("/registro/externo", "Registro externo", "03 Autenticación"),
    ("/verificar?correo=nuevo.usuario%40soyudemedellin.edu.co", "Verificación de correo", "03 Autenticación"),
    ("/ingresar", "Ingresar", "03 Autenticación"), ("/recuperar", "Recuperar contraseña 1: correo", "03 Autenticación"),
    ("/recuperar/codigo?correo=lmrestrepo%40soyudemedellin.edu.co", "Recuperar contraseña 2: código", "03 Autenticación"),
    ("/recuperar/nueva", "Recuperar contraseña 3: nueva", "03 Autenticación"), ("/recuperar/listo", "Contraseña actualizada", "03 Autenticación"),
    ("/personal", "Acceso del personal", "03 Autenticación"),
    ("/correos", "Índice de correos", "09 Correos"),
    *[(f"/correos/{k}", t, "09 Correos") for k, t in [("codigo_verificacion", "Código de verificación"), ("bienvenida", "Bienvenida"), ("codigo_recuperacion", "Código de recuperación"), ("reserva_confirmada", "Reserva confirmada"), ("factura_generada", "Factura generada"), ("pago_recibido", "Pago recibido"), ("pago_aprobado", "Pago aprobado"), ("pago_rechazado", "Pago rechazado"), ("recordatorio", "Recordatorio 24 h"), ("reserva_vencida", "Reserva vencida"), ("reserva_cancelada", "Reserva cancelada")]],
    ("/estados", "Catálogo de estados", "10 Estados del sistema"), ("/no-existe", "Página 404", "10 Estados del sistema"), ("/estados/error", "Error 500", "10 Estados del sistema"),
    ("/mantenimiento", "Mantenimiento", "10 Estados del sistema"), ("/sin-conexion", "Sin conexión", "10 Estados del sistema"),
  ],
  "comunidad": [
    ("/portal", "Inicio del usuario (comunidad)", "04 Portal usuario"),
    (f"/portal/reservar?{sel}", "Reservar 1: cancha, día y franja", "04 Portal usuario"),
    (f"/portal/reservar/datos?{sel}", "Reservar 2: datos", "04 Portal usuario"),
    (f"/portal/reservar/confirmar?{sel}&actividad=Microf%C3%BAtbol&participantes=10&observaciones=", "Reservar 3: confirmar", "04 Portal usuario"),
    (f"/portal/reservas/{l_conf}/lista", "Reserva confirmada con QR", "04 Portal usuario"),
    ("/portal/reservas", "Mis reservas: próximas", "04 Portal usuario"), ("/portal/reservas?tab=historial", "Mis reservas: historial", "04 Portal usuario"), ("/portal/reservas?tab=canceladas", "Mis reservas: canceladas", "04 Portal usuario"),
    (f"/portal/reservas/{l_conf}", "Detalle de reserva confirmada", "04 Portal usuario"), (f"/portal/reservas/{l_asis}", "Detalle: asistió", "04 Portal usuario"), (f"/portal/reservas/{l_canc}", "Detalle: cancelada", "04 Portal usuario"),
    ("/portal/avisos", "Avisos", "04 Portal usuario"), ("/portal/perfil", "Mi perfil (comunidad)", "04 Portal usuario"),
  ],
  "externo": [
    ("/portal", "Inicio del usuario (externo)", "04 Portal usuario"),
    (f"/portal/reservas/{v_pend[0]}/lista", "Reserva creada: horario apartado", "04 Portal usuario"),
    ("/portal/reservas?tab=pendientes", "Mis reservas: pendientes de pago", "04 Portal usuario"),
    (f"/portal/reservas/{v_pend[0]}", "Detalle: pendiente de pago", "04 Portal usuario"), (f"/portal/reservas/{v_rech}", "Detalle: pago rechazado", "04 Portal usuario"),
    *([(f"/portal/reservas/{v_valid}", "Detalle: en validación", "04 Portal usuario")] if v_valid else []),
    ("/portal/pagos", "Mis pagos y facturas", "04 Portal usuario"), ("/portal/pagos?ver=pagos", "Mis pagos: historial de pagos", "04 Portal usuario"),
    ("/portal/perfil", "Mi perfil (externo, con facturación)", "04 Portal usuario"), ("/portal/avisos", "Avisos (externo)", "04 Portal usuario"),
    (f"/pago/{v_pend[1]}", "Resumen de pago", "05 Pasarela de pagos"), (f"/pago/{v_pend[1]}/metodo", "Método de pago", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/tarjeta", "Tarjeta con vista previa", "05 Pasarela de pagos"), (f"/pago/{v_pend[1]}/pse", "PSE", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/billetera?metodo=nequi", "Nequi", "05 Pasarela de pagos"), (f"/pago/{v_pend[1]}/transferencia", "Transferencia o consignación", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/procesando?r=aprobado&m=tarjeta&ref=TC-52207178", "Procesando pago", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/resultado?r=aprobado&m=tarjeta&ref=TC-52207178", "Pago aprobado", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/resultado?r=rechazado&m=tarjeta&ref=TC-52207179", "Pago rechazado", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/resultado?r=pendiente&m=pse&ref=PSE-52207180", "Pago pendiente (PSE)", "05 Pasarela de pagos"),
    (f"/pago/{v_pend[1]}/comprobante", "Subir comprobante", "05 Pasarela de pagos"),
    (f"/factura/{v_conf[1] if len(v_conf) > 1 else v_pend[2]}", "Factura imprimible", "05 Pasarela de pagos"),
  ],
  "tesoreria": [
    ("/tesoreria", "Dashboard de Tesorería", "06 Tesorería"), ("/tesoreria/pagos", "Pagos por validar", "06 Tesorería"),
    (f"/tesoreria/pagos?ver={pago_val}", "Pagos: comprobante en drawer", "06 Tesorería"),
    ("/tesoreria/caja", "Registrar pago en caja", "06 Tesorería"), (f"/tesoreria/caja?factura={v_pend[2]}", "Caja: factura encontrada", "06 Tesorería"),
    ("/tesoreria/facturas", "Facturas sin pagar", "06 Tesorería"), ("/tesoreria/facturas?tab=pagada", "Facturas pagadas", "06 Tesorería"), ("/tesoreria/facturas?tab=vencida", "Facturas vencidas", "06 Tesorería"), ("/tesoreria/facturas?tab=todas", "Todas las facturas", "06 Tesorería"),
    (f"/tesoreria/facturas/{fac_num}", "Detalle de factura e historial", "06 Tesorería"),
  ],
  "bienestar": [
    ("/bienestar", "Dashboard de Bienestar", "07 Bienestar"), ("/bienestar/calendario", "Calendario: día", "07 Bienestar"),
    ("/bienestar/calendario?vista=semana&cancha=coliseo-cubierto", "Calendario: semana", "07 Bienestar"), ("/bienestar/calendario?vista=mes&cancha=coliseo-cubierto", "Calendario: mes", "07 Bienestar"),
    ("/bienestar/reservas", "Lista de reservas", "07 Bienestar"), (f"/bienestar/reservas/{b_res}", "Detalle de reserva (cancelar)", "07 Bienestar"), (f"/bienestar/reservas/{b_past}", "Detalle de reserva (asistencia)", "07 Bienestar"),
    ("/bienestar/canchas", "Gestión de canchas y bloqueos", "07 Bienestar"), ("/bienestar/reportes", "Reportes", "07 Bienestar"), ("/bienestar/reportes/imprimir", "Informe PDF", "07 Bienestar"),
  ],
  "admin": [
    ("/admin/usuarios", "Usuarios y personal", "08 Administrador"), ("/admin/usuarios?editar=nuevo", "Nueva cuenta del personal", "08 Administrador"), ("/admin/usuarios?tab=usuarios", "Usuarios registrados", "08 Administrador"),
    ("/admin/configuracion", "Configuración general", "08 Administrador"), ("/admin/configuracion?tab=canchas", "Canchas y tarifas", "08 Administrador"), ("/admin/configuracion?tab=avisos", "Avisos y correos", "08 Administrador"),
    ("/admin/auditoria", "Registro de auditoría", "08 Administrador"),
  ],
}

def nombre(url):
    s = urlsplit(url)
    base = s.path.strip("/").replace("/", "__") or "index"
    if s.query:
        base += "--" + re.sub(r"[^a-zA-Z0-9]+", "-", s.query).strip("-")[:80]
    return base + ".html"

ARCH = {rol: {u: nombre(u) for u, _, _ in rs} for rol, rs in RUTAS.items()}
# Pantallas a las que se llega desde el portal con sesión: si un rol no la tiene, se busca en estos roles
RESPALDO = {"comunidad": ["externo", "publico"], "externo": ["comunidad", "publico"], "tesoreria": ["admin", "publico"], "bienestar": ["admin", "publico"], "admin": ["tesoreria", "bienestar", "publico"], "publico": []}

def resolver(href, rol):
    if not href or href.startswith(("#", "mailto:", "tel:", "data:", "javascript:")) or href.startswith("http") and not href.startswith(B):
        return None
    h = href.replace(B, "")
    if not h.startswith("/"): return None
    s = urlsplit(h); full = s.path + (f"?{s.query}" if s.query else "")
    for r in [rol] + RESPALDO[rol]:
        m = ARCH[r]
        if full in m: return f"../{r}/{m[full]}"
        if s.path in m: return f"../{r}/{m[s.path]}"
        for u, f in m.items():  # misma ruta con otra consulta
            if urlsplit(u).path == s.path: return f"../{r}/{f}"
    return "../index.html"

INSIGNIA = '<a href="../index.html" class="mockup-volver" style="position:fixed;left:12px;bottom:12px;z-index:9999;background:#16222F;color:#fff;font:600 12px/1 \'Open Sans\',sans-serif;padding:9px 12px;border-radius:999px;text-decoration:none;box-shadow:0 6px 16px rgba(0,0,0,.3)">◂ Mapa de pantallas · mockup estático</a>'

def limpiar(html, rol):
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S | re.I)
    html = re.sub(r'<link[^>]+rel="(?:preload|modulepreload)"[^>]*as="script"[^>]*/?>', "", html)
    html = re.sub(r'<link[^>]+as="script"[^>]*/?>', "", html)
    html = re.sub(r'<next-route-announcer.*?</next-route-announcer>', "", html, flags=re.S)
    def rep_href(m):
        attr, val = m.group(1), m.group(2)
        val = val.replace("&amp;", "&")
        if val.startswith("/_next/") or val.startswith("/brand/") or val.startswith("/uploads/"):
            return f'{attr}="..{val}"'
        r = resolver(val, rol)
        return f'{attr}="{r}"' if r else m.group(0)
    html = re.sub(r'\b(href)="([^"]*)"', rep_href, html)
    html = re.sub(r'\b(src)="(/(?:_next|brand|uploads)/[^"]*)"', lambda m: f'src="..{m.group(2)}"', html)
    html = re.sub(r'\baction="[^"]*"', 'action="#"', html)
    html = re.sub(r'url\((/_next/[^)]+)\)', r'url(..\1)', html)
    html = html.replace("</body>", INSIGNIA + "</body>")
    return html

async def entrar_usuario(pg, correo):
    await pg.goto(B + "/ingresar"); await pg.fill("#correo", correo); await pg.fill("#password", "Cancha2026*")
    await pg.click("button[type=submit]"); await pg.wait_for_url(B + "/portal", timeout=20000)

async def entrar_personal(pg, correo, guardar=None):
    await pg.goto(B + "/personal"); await pg.fill("#correo", correo); await pg.fill("#password", "Cancha2026*")
    await pg.click("button[type=submit]"); await pg.wait_for_url(re.compile("/personal/verificar"), timeout=20000)
    await pg.wait_for_timeout(400)
    if guardar: guardar.append(await pg.content())
    c = (await pg.locator(".aviso--demo strong").first.inner_text()).strip()
    await pg.locator(".otp-grande input").first.click(); await pg.keyboard.type(c, delay=30)
    await pg.wait_for_url(re.compile("/(tesoreria|bienestar|admin)"), timeout=20000)

async def main():
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)
    shutil.copytree(f"{APP}/public/brand", f"{OUT}/brand")
    css_vistos = set()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        cuentas = {"publico": None, "comunidad": ("u", LAURA), "externo": ("u", VALLE), "tesoreria": ("p", "tesoreria@udemedellin.edu.co"), "bienestar": ("p", "bienestar@udemedellin.edu.co"), "admin": ("p", "admin@udemedellin.edu.co")}
        verif = []
        for rol, rutas in RUTAS.items():
            os.makedirs(f"{OUT}/{rol}", exist_ok=True)
            ctx = await b.new_context(viewport={"width": 1440, "height": 900})
            await ctx.add_init_script("try{localStorage.setItem('udem_cookies','todas')}catch(e){}")
            pg = await ctx.new_page()
            cu = cuentas[rol]
            if cu and cu[0] == "u": await entrar_usuario(pg, cu[1])
            elif cu: await entrar_personal(pg, cu[1], verif if rol == "tesoreria" else None)
            for url, titulo, _ in rutas:
                r = await pg.goto(B + url, wait_until="load")
                await pg.wait_for_timeout(900)
                html = await pg.content()
                for href in re.findall(r'href="(/_next/static/[^"]+\.css)"', html):
                    css_vistos.add(href)
                open(f"{OUT}/{rol}/{ARCH[rol][url]}", "w").write(limpiar(html, rol))
                print(rol, r.status if r else "-", url[:70])
            await ctx.close()
        # verificación en dos pasos del personal
        if verif:
            ARCH["publico"]["/personal/verificar"] = "personal__verificar.html"
            RUTAS["publico"].append(("/personal/verificar", "Verificación en dos pasos del personal", "03 Autenticación"))
            open(f"{OUT}/publico/personal__verificar.html", "w").write(limpiar(verif[0], "publico"))
        # CSS y fuentes
        ctx = await b.new_context(); pg = await ctx.new_page()
        for href in css_vistos:
            r = await pg.request.get(B + href); txt = await r.text()
            dest = f"{OUT}{href}"; os.makedirs(os.path.dirname(dest), exist_ok=True)
            for m in set(re.findall(r'url\((/_next/static/media/[^)]+)\)', txt)):
                rr = await pg.request.get(B + m); md = f"{OUT}{m}"; os.makedirs(os.path.dirname(md), exist_ok=True)
                open(md, "wb").write(await rr.body())
            txt = re.sub(r'url\(/_next/static/media/', 'url(../media/', txt)
            open(dest, "w").write(txt)
        await b.close()
    # Índice
    grupos = {}
    for rol, rs in RUTAS.items():
        for u, t, g in rs: grupos.setdefault(g, []).append((rol, ARCH[rol][u], t))
    etiqueta = {"publico": "Público", "comunidad": "Comunidad", "externo": "Externo", "tesoreria": "Tesorería", "bienestar": "Bienestar", "admin": "Administrador"}
    total = sum(len(v) for v in grupos.values())
    secciones = "".join(f'<section><h2>{g}</h2><ul>' + "".join(f'<li><a href="{r}/{f}"><span>{t}</span><em>{etiqueta[r]}</em></a></li>' for r, f, t in sorted(items, key=lambda x: 0)) + "</ul></section>" for g, items in sorted(grupos.items()))
    idx = f'''<!DOCTYPE html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mapa de pantallas · Reservas Deportivas Universidad de Medellín</title>
<style>body{{margin:0;font-family:"Open Sans",system-ui,sans-serif;background:#F5F6F7;color:#16222F}}header{{background:#C2262B;color:#fff;padding:40px 24px 56px;clip-path:polygon(0 0,100% 0,100% 85%,0 100%)}}header div,main{{width:min(1100px,100%);margin:0 auto}}header img{{height:48px}}h1{{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:64px;line-height:.9;text-transform:uppercase;margin:24px 0 10px}}header p{{margin:0;color:#FFE5E6;max-width:680px;line-height:1.6}}main{{padding:16px 24px 64px;box-sizing:border-box;columns:2 420px;column-gap:24px}}section{{break-inside:avoid;background:#fff;border:1px solid #E1E4E6;border-radius:12px;padding:18px 20px;margin:0 0 24px}}h2{{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-size:26px;text-transform:uppercase;margin:0 0 8px}}ul{{list-style:none;margin:0;padding:0}}li a{{display:flex;justify-content:space-between;gap:12px;padding:9px 6px;border-bottom:1px dashed #E1E4E6;color:#16222F;text-decoration:none;font-size:15px}}li a:hover{{background:#FBEDEE;color:#932428}}em{{font-style:normal;font-size:12px;font-weight:700;color:#4A5560;white-space:nowrap}}.extra{{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}}.extra a{{background:#F3D941;color:#16222F;font-weight:700;padding:12px 16px;border-radius:8px;text-decoration:none}}</style></head><body>
<header><div><img src="brand/logo-blanco.png" alt="Universidad de Medellín"><h1>Mapa de pantallas</h1><p>{total} pantallas de la plataforma, capturadas de la aplicación real con datos de demostración. Son copias estáticas (sin servidor): puedes navegar entre ellas, revisarlas en 1440 o en móvil, e importarlas a Figma con html.to.design. Los formularios no envían datos.</p>
<div class="extra"><a href="../design-system.html">01 Design System</a><a href="publico/index.html">Empezar por el inicio</a></div></div></header><main>{secciones}</main></body></html>'''
    open(f"{OUT}/index.html", "w").write(idx)
    print("Total pantallas:", total)

asyncio.run(main())
