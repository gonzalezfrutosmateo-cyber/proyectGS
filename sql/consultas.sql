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
