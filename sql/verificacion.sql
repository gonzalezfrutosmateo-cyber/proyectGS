-- ============================================================================
-- Verificacion de los 9 ejemplos de la consigna contra los datos de sql/seed.sql
--
--   mysql -u root -p grand_slam --table < sql/verificacion.sql
--
-- Al lado de cada consulta esta el resultado que tiene que dar con el seed.
-- ============================================================================
SET NAMES utf8mb4;
USE grand_slam;

-- ----------------------------------------------------------------------------
-- 1. Dado un anio y un torneo: composicion y resultado de los partidos
--    Roland Garros 1979 -> 3 partidos (cuartos, semifinal y final)
-- ----------------------------------------------------------------------------
SELECT t.nombre AS torneo, e.anio, s.nombre AS sede, p.fase, p.modalidad, p.estado,
       (SELECT GROUP_CONCAT(j.apellido ORDER BY j.apellido SEPARATOR ' / ')
          FROM PARTIDO_JUGADOR pj JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
         WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'ganador')  AS ganadores,
       (SELECT GROUP_CONCAT(j.apellido ORDER BY j.apellido SEPARATOR ' / ')
          FROM PARTIDO_JUGADOR pj JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
         WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'perdedor') AS perdedores,
       COALESCE((SELECT GROUP_CONCAT(CONCAT(rs.games_ganador, '-', rs.games_perdedor)
                                     ORDER BY rs.nro_set SEPARATOR ' / ')
                   FROM RESULTADO_SET rs WHERE rs.PARTIDO_id_partido = p.id_partido), 'sin sets') AS resultado,
       a.apellido AS arbitro
FROM PARTIDO p
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo = e.TORNEO_id_torneo
JOIN SEDE    s ON s.id_sede = e.SEDE_id_sede
JOIN ARBITRO a ON a.id_arbitro = p.ARBITRO_id_arbitro
WHERE t.nombre = 'Roland Garros' AND e.anio = 1979
ORDER BY p.fecha;

-- ----------------------------------------------------------------------------
-- 2. Lista de arbitros que participaron en un torneo
--    Roland Garros -> Bell y Wilkinson
-- ----------------------------------------------------------------------------
SELECT DISTINCT a.nombre, a.apellido
FROM ARBITRO a
JOIN PARTIDO p ON p.ARBITRO_id_arbitro = a.id_arbitro
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo = e.TORNEO_id_torneo
WHERE t.nombre = 'Roland Garros'
ORDER BY a.apellido;

-- ----------------------------------------------------------------------------
-- 3. Ganancias percibidas en premios por un jugador
--    Borg -> 2000000.00 (ejemplo 7)
-- ----------------------------------------------------------------------------
SELECT j.apellido AS jugador,
       SUM(CASE WHEN pj.rol = 'perdedor' THEN pr.monto_perdedor
                WHEN pj.rol = 'ganador' AND p.fase = 'Final' THEN pr.monto_campeon
                ELSE 0 END) AS ganancias
FROM PARTIDO_JUGADOR pj
JOIN PARTIDO p  ON p.id_partido = pj.PARTIDO_id_partido
JOIN PREMIO  pr ON pr.EDICION_id_edicion = p.EDICION_id_edicion
                AND pr.modalidad = p.modalidad AND pr.fase = p.fase
JOIN JUGADOR j  ON j.id_jugador = pj.JUGADOR_id_jugador
WHERE j.apellido = 'Borg'
GROUP BY j.id_jugador, j.apellido;

-- ----------------------------------------------------------------------------
-- 4. Entrenadores de un jugador y las fechas en que lo entrenaron
--    Perez -> Ruiz (2018-2019), Diaz (2019-2021) y Ruiz otra vez (2022, sigue)
-- ----------------------------------------------------------------------------
SELECT CONCAT(j.apellido, ', ', j.nombre) AS jugador,
       CONCAT(en.apellido, ', ', en.nombre) AS entrenador,
       e.fecha_inicio,
       COALESCE(DATE_FORMAT(e.fecha_fin, '%Y-%m-%d'), 'sigue') AS fecha_fin
FROM ENTRENAMIENTO e
JOIN JUGADOR    j  ON j.id_jugador = e.JUGADOR_id_jugador
JOIN ENTRENADOR en ON en.id_entrenador = e.ENTRENADOR_id_entrenador
WHERE j.apellido = 'Pérez'
ORDER BY e.fecha_inicio;

-- ----------------------------------------------------------------------------
-- 5. "Connors gano a Gerulaitis" -> Roland Garros 1979, cuartos, 6-3 / 4-6 / 7-5 / 6-0
-- ----------------------------------------------------------------------------
SELECT t.nombre AS torneo, e.anio, p.fase, p.modalidad,
       jg.apellido AS gano, jp.apellido AS perdio,
       (SELECT GROUP_CONCAT(CONCAT(rs.games_ganador, '-', rs.games_perdedor)
                            ORDER BY rs.nro_set SEPARATOR ' / ')
          FROM RESULTADO_SET rs WHERE rs.PARTIDO_id_partido = p.id_partido) AS resultado
FROM PARTIDO p
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo = e.TORNEO_id_torneo
JOIN PARTIDO_JUGADOR pg ON pg.PARTIDO_id_partido = p.id_partido AND pg.rol = 'ganador'
JOIN JUGADOR jg ON jg.id_jugador = pg.JUGADOR_id_jugador
JOIN PARTIDO_JUGADOR pp ON pp.PARTIDO_id_partido = p.id_partido AND pp.rol = 'perdedor'
JOIN JUGADOR jp ON jp.id_jugador = pp.JUGADOR_id_jugador
WHERE jg.apellido = 'Connors' AND jp.apellido = 'Gerulaitis';

-- ----------------------------------------------------------------------------
-- 6. "El senor Wilkinson arbitro ese partido" -> una fila por partido que dirigio,
--    entre ellos el cuartos de Roland Garros 1979 del punto 5
-- ----------------------------------------------------------------------------
SELECT a.apellido AS arbitro, t.nombre AS torneo, e.anio, p.fase, p.modalidad,
       (SELECT GROUP_CONCAT(j.apellido ORDER BY j.apellido SEPARATOR ' / ')
          FROM PARTIDO_JUGADOR pj JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
         WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'ganador')  AS ganadores,
       (SELECT GROUP_CONCAT(j.apellido ORDER BY j.apellido SEPARATOR ' / ')
          FROM PARTIDO_JUGADOR pj JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
         WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'perdedor') AS perdedores
FROM PARTIDO p
JOIN ARBITRO a ON a.id_arbitro = p.ARBITRO_id_arbitro
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo = e.TORNEO_id_torneo
WHERE a.apellido = 'Wilkinson'
ORDER BY p.fecha;

-- ----------------------------------------------------------------------------
-- 7. "Alemania ha ganado dos veces las individuales masculinas de Wimbledon"
--    -> Alemania, 2 (Becker en 1986 y Stich en 1991)
-- ----------------------------------------------------------------------------
SELECT pa.nombre AS pais, COUNT(*) AS finales_ganadas,
       GROUP_CONCAT(CONCAT(j.apellido, ' ', e.anio) ORDER BY e.anio SEPARATOR ', ') AS detalle
FROM PARTIDO p
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo = e.TORNEO_id_torneo
JOIN PARTIDO_JUGADOR pj ON pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'ganador'
JOIN JUGADOR j  ON j.id_jugador = pj.JUGADOR_id_jugador
JOIN JUGADOR_PAIS jpa ON jpa.JUGADOR_id_jugador = j.id_jugador
JOIN PAIS pa ON pa.id_pais = jpa.PAIS_id_pais
WHERE t.nombre = 'Wimbledon' AND p.fase = 'Final' AND p.modalidad = 'individual-masculino'
  AND pa.nombre = 'Alemania'
GROUP BY pa.id_pais, pa.nombre;

-- ----------------------------------------------------------------------------
-- 8. "El ganador de Roland Garros de 1987 gano 20.000 dolares"
--    -> Lendl, 20000.00
-- ----------------------------------------------------------------------------
SELECT t.nombre AS torneo, e.anio, CONCAT(j.apellido, ', ', j.nombre) AS campeon,
       pr.monto_campeon AS premio
FROM PARTIDO p
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo = e.TORNEO_id_torneo
JOIN PARTIDO_JUGADOR pj ON pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'ganador'
JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
JOIN PREMIO pr ON pr.EDICION_id_edicion = p.EDICION_id_edicion
               AND pr.modalidad = p.modalidad AND pr.fase = p.fase
WHERE t.nombre = 'Roland Garros' AND e.anio = 1987
  AND p.fase = 'Final' AND p.modalidad = 'individual-masculino';

-- ----------------------------------------------------------------------------
-- 9. "Noah ha jugado cuatro veces en dobles mixtos con Mandlikova"
--    -> Mandlikova, 4
-- ----------------------------------------------------------------------------
SELECT j2.apellido AS companero, COUNT(*) AS veces
FROM PARTIDO_JUGADOR a
JOIN PARTIDO_JUGADOR b ON b.PARTIDO_id_partido = a.PARTIDO_id_partido
                      AND b.rol = a.rol
                      AND b.JUGADOR_id_jugador <> a.JUGADOR_id_jugador
JOIN PARTIDO p  ON p.id_partido = a.PARTIDO_id_partido
JOIN JUGADOR j1 ON j1.id_jugador = a.JUGADOR_id_jugador
JOIN JUGADOR j2 ON j2.id_jugador = b.JUGADOR_id_jugador
WHERE p.modalidad = 'dobles-mixto' AND j1.apellido = 'Noah'
GROUP BY j2.id_jugador, j2.apellido
ORDER BY veces DESC;

-- ----------------------------------------------------------------------------
-- Extra: nacionalidades. Un jugador puede ser apatrida o tener varias.
--    -> Gomez sin nacionalidad, Navratilova con dos
-- ----------------------------------------------------------------------------
SELECT CONCAT(j.apellido, ', ', j.nombre) AS jugador,
       COUNT(jp.PAIS_id_pais) AS nacionalidades,
       COALESCE(GROUP_CONCAT(pa.nombre ORDER BY pa.nombre SEPARATOR ' + '), 'apatrida') AS cuales
FROM JUGADOR j
LEFT JOIN JUGADOR_PAIS jp ON jp.JUGADOR_id_jugador = j.id_jugador
LEFT JOIN PAIS pa ON pa.id_pais = jp.PAIS_id_pais
GROUP BY j.id_jugador, j.apellido, j.nombre
HAVING nacionalidades <> 1
ORDER BY nacionalidades DESC;
