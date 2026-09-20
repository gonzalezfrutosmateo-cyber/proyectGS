-- ============================================================================
-- Consultas de los "resultados a considerar" de la consigna
--
--   mysql -u root -p grand_slam --table < sql/consultas.sql
--
-- Cada consulta esta parametrizada con variables de sesion (SET @...), asi se
-- puede correr tal cual desde la consola. En el backend las variables se
-- reemplazan por placeholders ? de mysql2.
-- Los datos con los que se prueba salen de sql/seed.sql.
-- ============================================================================
SET NAMES utf8mb4;
USE grand_slam;

-- ----------------------------------------------------------------------------
-- Consulta 1. Dado un anio y un torneo: composicion y resultado de los partidos
--
-- Entrada: @anio y @torneo.
-- Salida:  por cada partido, la modalidad, la fase, los jugadores de cada lado,
--          el resultado set por set, el estado, el arbitro, la fecha y la sede.
--
-- Como se arma:
--   * Los jugadores salen de PARTIDO_JUGADOR. En dobles son 2 por lado, asi que
--     van dos subconsultas separadas, una de ganadores y otra de perdedores. Con
--     un solo GROUP_CONCAT se mezclarian los dos lados del partido.
--   * El resultado son N filas de RESULTADO_SET y se arma en una sola cadena con
--     GROUP_CONCAT ordenado por nro_set: "6-3 4-6 7-5 6-0".
--   * Los games estan guardados como del ganador y del perdedor del partido, por
--     eso el 4-6 del segundo set se lee tal cual.
--   * Un walkover no tiene sets: el COALESCE devuelve 'sin sets'.
--   * El ORDER BY con FIELD ordena las fases como el cuadro, no alfabeticamente.
--
-- En el backend, la misma consulta va con placeholders:
--     WHERE t.nombre = ? AND e.anio = ?
-- ----------------------------------------------------------------------------
SET @torneo = 'Roland Garros';
SET @anio   = 1979;

SELECT p.fecha,
       t.nombre AS torneo,
       e.anio,
       s.nombre AS sede,
       p.modalidad,
       p.fase,
       (SELECT GROUP_CONCAT(CONCAT(j.nombre, ' ', j.apellido) ORDER BY j.apellido SEPARATOR ' / ')
          FROM PARTIDO_JUGADOR pj
          JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
         WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'ganador')  AS ganadores,
       (SELECT GROUP_CONCAT(CONCAT(j.nombre, ' ', j.apellido) ORDER BY j.apellido SEPARATOR ' / ')
          FROM PARTIDO_JUGADOR pj
          JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
         WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'perdedor') AS perdedores,
       COALESCE((SELECT GROUP_CONCAT(CONCAT(rs.games_ganador, '-', rs.games_perdedor)
                                     ORDER BY rs.nro_set SEPARATOR ' ')
                   FROM RESULTADO_SET rs
                  WHERE rs.PARTIDO_id_partido = p.id_partido), 'sin sets') AS resultado,
       p.estado,
       CONCAT(a.nombre, ' ', a.apellido) AS arbitro
FROM PARTIDO p
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo  = e.TORNEO_id_torneo
JOIN SEDE    s ON s.id_sede    = e.SEDE_id_sede
JOIN ARBITRO a ON a.id_arbitro = p.ARBITRO_id_arbitro
WHERE t.nombre = @torneo
  AND e.anio   = @anio
ORDER BY FIELD(p.fase, 'R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final'),
         p.modalidad, p.fecha;

-- ----------------------------------------------------------------------------
-- Consulta 2. Arbitros que participaron en un torneo
--
-- Entrada: @torneo, y @anio, que es opcional.
--   * @anio = 1979 -> los arbitros de esa edicion.
--   * @anio = NULL -> los de todas las ediciones del torneo.
--   La consigna no aclara si pide una edicion o la historia completa, asi que la
--   consulta sirve para las dos: el filtro del anio se aplica solo si no es NULL.
--
-- Salida: cada arbitro una sola vez, con cuantos partidos dirigio y en que anios.
--
-- Detalles:
--   * El COUNT(*) cuenta partidos porque la fila se repite una vez por partido.
--   * No se filtra por ARBITRO.activo: la baja logica lo saca de los listados de
--     alta, pero los partidos que dirigio son historia y tienen que seguir.
--
-- En el backend:
--     WHERE t.nombre = ? AND (? IS NULL OR e.anio = ?)
-- ----------------------------------------------------------------------------
SET @torneo = 'Roland Garros';
SET @anio   = 1979;   -- NULL para toda la historia del torneo

SELECT a.apellido,
       a.nombre,
       COUNT(*)                      AS partidos_dirigidos,
       COUNT(DISTINCT e.id_edicion)  AS ediciones,
       GROUP_CONCAT(DISTINCT e.anio ORDER BY e.anio SEPARATOR ', ') AS anios
FROM ARBITRO a
JOIN PARTIDO p ON p.ARBITRO_id_arbitro = a.id_arbitro
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo  = e.TORNEO_id_torneo
WHERE t.nombre = @torneo
  AND (@anio IS NULL OR e.anio = @anio)
GROUP BY a.id_arbitro, a.apellido, a.nombre
ORDER BY partidos_dirigidos DESC, a.apellido;

-- ----------------------------------------------------------------------------
-- Consulta 3. Ganancias percibidas en premios por un jugador
--
-- Entrada: @apellido.
-- Salida:  cuanto cobro en total en premios.
--
-- Como cobra un jugador, segun PREMIO (por edicion, modalidad y fase):
--   * Si perdio un partido, cobra el premio de consolacion de esa fase.
--   * Si gano la final, cobra el premio del campeon de esa edicion y modalidad.
--   * Ganar un partido que no es la final no paga nada: se cobra al quedar
--     eliminado, o al salir campeon.
--
-- DECISION (version A). Se suma el premio de cada partido perdido, mas el de
-- campeon si gano la final. La alternativa (version B) era, por cada edicion,
-- buscar la fase mas avanzada que alcanzo y pagar solo esa.
--   Las dos dan lo mismo mientras un jugador pierda una sola vez por edicion y
--   modalidad, que es lo normal: al perder queda eliminado. La A es mas simple y
--   aguanta bien los walkovers y los abandonos.
--   Para que no quede como un supuesto silencioso, mas abajo esta la consulta de
--   control que busca el caso que las diferenciaria. Si alguna vez devuelve
--   filas, hay que pasar a la version B.
--
-- Un jugador puede jugar varias modalidades en la misma edicion (individual y
-- dobles) y cobra por cada una: el JOIN con PREMIO usa edicion + modalidad +
-- fase, asi que las suma todas.
--
-- El JOIN con PREMIO es interno a proposito: un partido sin su fila de PREMIO no
-- suma. Al cargar una edicion hay que cargar los premios de todas sus fases.
--
-- En el backend: WHERE j.apellido = ?
-- ----------------------------------------------------------------------------
SET @apellido = 'Borg';

SELECT CONCAT(j.apellido, ', ', j.nombre) AS jugador,
       SUM(CASE WHEN pj.rol = 'perdedor'                     THEN pr.monto_perdedor
                WHEN pj.rol = 'ganador' AND p.fase = 'Final' THEN pr.monto_campeon
                ELSE 0 END) AS ganancias
FROM JUGADOR j
JOIN PARTIDO_JUGADOR pj ON pj.JUGADOR_id_jugador = j.id_jugador
JOIN PARTIDO p  ON p.id_partido = pj.PARTIDO_id_partido
JOIN PREMIO  pr ON pr.EDICION_id_edicion = p.EDICION_id_edicion
                AND pr.modalidad = p.modalidad
                AND pr.fase      = p.fase
WHERE j.apellido = @apellido
GROUP BY j.id_jugador, j.apellido, j.nombre;

-- Detalle de donde sale cada peso, para mostrarlo en la pagina o para controlar
SELECT t.nombre AS torneo,
       e.anio,
       p.modalidad,
       p.fase,
       CASE WHEN pj.rol = 'perdedor'  THEN 'perdio'
            WHEN p.fase = 'Final'     THEN 'campeon'
            ELSE 'gano y siguio' END AS que_paso,
       CASE WHEN pj.rol = 'perdedor'  THEN pr.monto_perdedor
            WHEN p.fase = 'Final'     THEN pr.monto_campeon
            ELSE 0 END AS cobro
FROM JUGADOR j
JOIN PARTIDO_JUGADOR pj ON pj.JUGADOR_id_jugador = j.id_jugador
JOIN PARTIDO p  ON p.id_partido = pj.PARTIDO_id_partido
JOIN EDICION e  ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t  ON t.id_torneo  = e.TORNEO_id_torneo
JOIN PREMIO  pr ON pr.EDICION_id_edicion = p.EDICION_id_edicion
                AND pr.modalidad = p.modalidad
                AND pr.fase      = p.fase
WHERE j.apellido = @apellido
ORDER BY e.anio, p.modalidad,
         FIELD(p.fase, 'R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final');

-- Control de la decision: nadie tendria que perder dos veces en la misma edicion
-- y modalidad. Si esto devuelve filas, los datos estan mal cargados o hay que
-- pasar a la version B.
SELECT j.apellido, t.nombre AS torneo, e.anio, p.modalidad, COUNT(*) AS veces_que_perdio
FROM PARTIDO_JUGADOR pj
JOIN PARTIDO p ON p.id_partido = pj.PARTIDO_id_partido
JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
JOIN TORNEO  t ON t.id_torneo  = e.TORNEO_id_torneo
JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
WHERE pj.rol = 'perdedor'
GROUP BY j.id_jugador, j.apellido, t.id_torneo, t.nombre, e.anio, p.modalidad
HAVING veces_que_perdio > 1;

-- ----------------------------------------------------------------------------
-- Consulta 4. Entrenadores que entrenaron a un jugador, y desde cuando
--
-- Entrada: @apellido.
-- Salida:  un renglon por periodo, ordenado por fecha. Si el entrenamiento sigue
--          abierto (fecha_fin NULL) se muestra "actualidad".
--
-- Sale directo de ENTRENAMIENTO, que desde la task #4 es la tabla que relaciona
-- jugador con entrenador. Un mismo entrenador puede aparecer dos veces si lo
-- entreno en dos epocas: por eso la PK incluye fecha_inicio.
--
-- Alimenta la tabla "Entrenadores" de jugadores.html.
--
-- En el backend: WHERE j.apellido = ?
-- ----------------------------------------------------------------------------
SET @apellido = 'Pérez';

SELECT en.apellido,
       en.nombre,
       e.fecha_inicio,
       COALESCE(DATE_FORMAT(e.fecha_fin, '%Y-%m-%d'), 'actualidad') AS fecha_fin,
       TIMESTAMPDIFF(MONTH, e.fecha_inicio, COALESCE(e.fecha_fin, CURDATE())) AS meses
FROM ENTRENAMIENTO e
JOIN ENTRENADOR en ON en.id_entrenador = e.ENTRENADOR_id_entrenador
JOIN JUGADOR    j  ON j.id_jugador = e.JUGADOR_id_jugador
WHERE j.apellido = @apellido
ORDER BY e.fecha_inicio;

-- ----------------------------------------------------------------------------
-- Variante de la consulta 4: los que lo entrenaron durante una edicion concreta
--
-- La consigna dice "a lo largo del torneo", que se puede leer como toda la
-- carrera del jugador (la consulta de arriba) o como una edicion puntual (esta).
-- Quedan las dos para que el profe elija.
--
-- EDICION no tiene fechas propias, asi que la ventana de la edicion se toma de
-- las fechas de sus partidos. Un entrenamiento cuenta si se superpone con esa
-- ventana: empezo antes de que terminara la edicion y no habia terminado cuando
-- la edicion empezo.
-- ----------------------------------------------------------------------------
SET @apellido = 'Borg';
SET @torneo   = 'Roland Garros';
SET @anio     = 1979;

SELECT en.apellido,
       en.nombre,
       e.fecha_inicio,
       COALESCE(DATE_FORMAT(e.fecha_fin, '%Y-%m-%d'), 'actualidad') AS fecha_fin
FROM ENTRENAMIENTO e
JOIN ENTRENADOR en ON en.id_entrenador = e.ENTRENADOR_id_entrenador
JOIN JUGADOR    j  ON j.id_jugador = e.JUGADOR_id_jugador
WHERE j.apellido = @apellido
  AND e.fecha_inicio <= (SELECT MAX(p.fecha)
                           FROM PARTIDO p
                           JOIN EDICION ed ON ed.id_edicion = p.EDICION_id_edicion
                           JOIN TORNEO  t  ON t.id_torneo = ed.TORNEO_id_torneo
                          WHERE t.nombre = @torneo AND ed.anio = @anio)
  AND (e.fecha_fin IS NULL
       OR e.fecha_fin >= (SELECT MIN(p.fecha)
                            FROM PARTIDO p
                            JOIN EDICION ed ON ed.id_edicion = p.EDICION_id_edicion
                            JOIN TORNEO  t  ON t.id_torneo = ed.TORNEO_id_torneo
                           WHERE t.nombre = @torneo AND ed.anio = @anio))
ORDER BY e.fecha_inicio;
