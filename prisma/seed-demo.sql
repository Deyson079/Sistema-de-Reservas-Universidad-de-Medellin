-- Genera reservas, facturas y pagos de demostración (30 días de historia y 14 días hacia adelante).
-- Requiere que ya existan canchas, personal y usuarios (npm run db:seed los crea).
-- Uso directo en Supabase: SQL Editor → pegar y ejecutar. Borra antes las reservas existentes.
DELETE FROM pagos; DELETE FROM facturas; DELETE FROM reservas;

DO $$
DECLARE
  hoy date := (now() AT TIME ZONE 'America/Bogota')::date;
  hact int := extract(hour FROM now() AT TIME ZONE 'America/Bogota')::int;
  ahora_utc timestamp := now() AT TIME ZONE 'UTC';
  d int; h int; c record; u record; f date; prob float; pasada bool; ext bool; x float;
  est "EstadoReserva"; fest "EstadoFactura"; met "MetodoPago";
  rid text; fid text; nfac int := 1; ncod int := 21000;
  creada timestamp; inicio timestamp; pago_en timestamp; lim timestamp;
  tes text; vol text; col text; sint text; placa text; laura text; valle text;
BEGIN
  PERFORM setseed(0.4216);
  SELECT id INTO tes FROM personal WHERE rol = 'tesoreria' ORDER BY creado_en LIMIT 1;
  SELECT id INTO vol FROM canchas WHERE slug = 'cancha-de-voleibol';
  SELECT id INTO col FROM canchas WHERE slug = 'coliseo-cubierto';
  SELECT id INTO sint FROM canchas WHERE slug = 'cancha-sintetica';
  SELECT id INTO placa FROM canchas WHERE slug = 'placa-polideportiva-1';
  SELECT id INTO laura FROM usuarios WHERE correo = 'lmrestrepo@soyudemedellin.edu.co';
  SELECT id INTO valle FROM usuarios WHERE correo = 'contacto@deportesdelvalle.co';

  FOR d IN -30..13 LOOP
    f := hoy + d;
    CONTINUE WHEN extract(dow FROM f) = 0;
    FOR c IN SELECT * FROM canchas ORDER BY orden LOOP
      FOR h IN 6..21 LOOP
        CONTINUE WHEN c.id = vol AND d BETWEEN -2 AND 4;
        CONTINUE WHEN c.id = col AND d = 5 AND h BETWEEN 8 AND 13;
        prob := (CASE WHEN h >= 18 THEN .85 WHEN h >= 16 THEN .55 WHEN h >= 12 AND h < 14 THEN .45 WHEN h < 8 THEN .3 ELSE .2 END)
                * (CASE WHEN d > 0 THEN greatest(.15, 1 - d / 12.0) ELSE 1 END);
        CONTINUE WHEN random() > prob;
        pasada := d < 0 OR (d = 0 AND h <= hact);
        ext := random() < .28;
        SELECT * INTO u FROM usuarios WHERE tipo = (CASE WHEN ext THEN 'externo' ELSE 'comunidad' END)::"TipoUsuario" AND estado = 'activo' ORDER BY random() LIMIT 1;
        x := random();
        IF pasada THEN est := CASE WHEN x < .78 THEN 'asistio' WHEN x < .86 THEN 'no_asistio' WHEN x < .95 OR NOT ext THEN 'cancelada' ELSE 'vencida' END;
        ELSIF ext THEN est := CASE WHEN x < .55 THEN 'confirmada' WHEN x < .8 THEN 'pendiente_pago' ELSE 'en_validacion' END;
        ELSE est := 'confirmada';
        END IF;
        inicio := f + make_interval(hours => h + 5);
        creada := inicio - make_interval(days => 1 + floor(random() * 5)::int);
        lim := CASE WHEN est = 'pendiente_pago' THEN least(ahora_utc + make_interval(hours => (6 + floor(random() * 40))::int), inicio - interval '1 hour') END;
        rid := gen_random_uuid()::text;
        INSERT INTO reservas (id, codigo, usuario_id, cancha_id, fecha, hora_inicio, hora_fin, actividad, participantes, estado, creada_en, actualizada_en, limite_pago, motivo_cancelacion, cancelada_por)
        VALUES (rid, 'RD-' || ncod, u.id, c.id, f, h, h + 1, c.deportes[1 + floor(random() * array_length(c.deportes, 1))::int],
                greatest(4, floor(c.capacidad * (.5 + random() * .5))::int), est, creada, creada, lim,
                CASE WHEN est = 'cancelada' THEN (ARRAY['Se cruzó con una clase', 'El equipo no estaba completo', 'Lluvia'])[1 + floor(random() * 3)::int] END,
                CASE WHEN est = 'cancelada' THEN 'Usuario' END);
        ncod := ncod + 1;
        IF ext THEN
          fest := CASE WHEN est IN ('pendiente_pago', 'en_validacion') THEN 'sin_pagar' WHEN est = 'vencida' THEN 'vencida' WHEN est = 'cancelada' THEN 'anulada' ELSE 'pagada' END;
          fid := gen_random_uuid()::text;
          INSERT INTO facturas (id, reserva_id, numero, valor, iva, total, estado, creada_en, vence_en)
          VALUES (fid, rid, 'FV-2026-' || lpad(nfac::text, 6, '0'), c.tarifa_hora, 0, c.tarifa_hora, fest, creada, creada + interval '48 hours');
          nfac := nfac + 1;
          IF fest = 'pagada' THEN
            pago_en := creada + make_interval(hours => floor(random() * 30)::int);
            INSERT INTO pagos (id, factura_id, metodo, referencia, valor, fecha_pago, estado, validado_por, validado_en, fecha)
            VALUES (gen_random_uuid()::text, fid, (ARRAY['tarjeta', 'pse', 'nequi', 'transferencia', 'daviplata', 'caja'])[1 + floor(random() * 6)::int]::"MetodoPago",
                    (88000000 + floor(random() * 999999))::text, c.tarifa_hora, pago_en::date, 'validado', tes, pago_en + interval '5 hours', pago_en);
          ELSIF est = 'en_validacion' THEN
            met := (ARRAY['transferencia', 'pse', 'nequi', 'tarjeta'])[1 + floor(random() * 4)::int]::"MetodoPago";
            pago_en := ahora_utc - make_interval(hours => floor(random() * 40)::int);
            INSERT INTO pagos (id, factura_id, metodo, referencia, banco, comprobante_url, valor, fecha_pago, estado, fecha)
            VALUES (gen_random_uuid()::text, fid, met, (88000000 + floor(random() * 999999))::text,
                    CASE WHEN met IN ('transferencia', 'pse') THEN (ARRAY['Bancolombia', 'Davivienda', 'Banco de Bogotá'])[1 + floor(random() * 3)::int] END,
                    CASE WHEN met = 'transferencia' THEN '/brand/comprobante-ejemplo.png' END,
                    CASE WHEN random() < .15 THEN c.tarifa_hora - 10000 ELSE c.tarifa_hora END, pago_en::date, 'en_validacion', pago_en);
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  -- Reservas fijas de las cuentas de prueba
  DELETE FROM reservas r WHERE NOT EXISTS (SELECT 1 FROM facturas fa WHERE fa.reserva_id = r.id) AND (
    (r.cancha_id = col AND r.fecha = hoy + 1 AND r.hora_inicio = 18) OR (r.cancha_id = placa AND r.fecha = hoy + 3 AND r.hora_inicio = 17) OR
    (r.cancha_id = sint AND r.fecha = hoy - 3 AND r.hora_inicio = 19) OR (r.cancha_id = sint AND r.fecha = hoy + 2 AND r.hora_inicio = 20) OR
    (r.cancha_id = placa AND r.fecha = hoy + 4 AND r.hora_inicio = 19));
  IF laura IS NOT NULL THEN
    INSERT INTO reservas (id, codigo, usuario_id, cancha_id, fecha, hora_inicio, hora_fin, actividad, participantes, estado, actualizada_en, motivo_cancelacion, cancelada_por)
    SELECT gen_random_uuid()::text, 'RD-' || (ncod + n), laura, cid, hoy + dd, hh, hh + 1, act, 10, e::"EstadoReserva", ahora_utc, mot, cp
    FROM (VALUES (1, col, 1, 18, 'Baloncesto', 'confirmada', NULL, NULL), (2, placa, 3, 17, 'Microfútbol', 'confirmada', NULL, NULL),
                 (3, sint, -3, 19, 'Fútbol 8', 'asistio', NULL, NULL), (4, col, -6, 18, 'Voleibol', 'cancelada', 'Se cruzó con una clase', 'Usuario')) v(n, cid, dd, hh, act, e, mot, cp)
    WHERE NOT EXISTS (SELECT 1 FROM reservas r WHERE r.cancha_id = v.cid AND r.fecha = hoy + v.dd AND r.hora_inicio = v.hh AND r.estado IN ('confirmada', 'pendiente_pago', 'en_validacion', 'asistio', 'no_asistio')) OR v.e = 'cancelada';
    ncod := ncod + 10;
  END IF;
  IF valle IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservas WHERE cancha_id = sint AND fecha = hoy + 2 AND hora_inicio = 20 AND estado IN ('confirmada', 'pendiente_pago', 'en_validacion')) THEN
    rid := gen_random_uuid()::text; lim := ahora_utc + interval '30 hours';
    INSERT INTO reservas (id, codigo, usuario_id, cancha_id, fecha, hora_inicio, hora_fin, actividad, participantes, estado, limite_pago, actualizada_en)
    VALUES (rid, 'RD-' || ncod, valle, sint, hoy + 2, 20, 21, 'Fútbol 8', 16, 'pendiente_pago', lim, ahora_utc);
    INSERT INTO facturas (id, reserva_id, numero, valor, total, vence_en) VALUES (gen_random_uuid()::text, rid, 'FV-2026-' || lpad(nfac::text, 6, '0'), 150000, 150000, lim);
    nfac := nfac + 1; ncod := ncod + 1;
  END IF;
  IF valle IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservas WHERE cancha_id = placa AND fecha = hoy + 4 AND hora_inicio = 19 AND estado IN ('confirmada', 'pendiente_pago', 'en_validacion')) THEN
    rid := gen_random_uuid()::text; fid := gen_random_uuid()::text; lim := ahora_utc + interval '20 hours';
    INSERT INTO reservas (id, codigo, usuario_id, cancha_id, fecha, hora_inicio, hora_fin, actividad, participantes, estado, limite_pago, actualizada_en)
    VALUES (rid, 'RD-' || ncod, valle, placa, hoy + 4, 19, 20, 'Microfútbol', 10, 'rechazada', lim, ahora_utc);
    INSERT INTO facturas (id, reserva_id, numero, valor, total, vence_en) VALUES (fid, rid, 'FV-2026-' || lpad(nfac::text, 6, '0'), 80000, 80000, lim);
    INSERT INTO pagos (id, factura_id, metodo, referencia, valor, fecha_pago, estado, motivo_rechazo, validado_por, validado_en, comprobante_url)
    VALUES (gen_random_uuid()::text, fid, 'transferencia', '88213450', 70000, hoy - 1, 'rechazado', 'El valor del comprobante ($70.000) no coincide con el total de la factura ($80.000).', tes, ahora_utc - interval '5 hours', '/brand/comprobante-ejemplo.png');
  END IF;
END $$;
