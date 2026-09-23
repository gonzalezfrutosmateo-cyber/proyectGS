-- ============================================================================
-- Datos de ejemplo de la base del Grand Slam
--
--   mysql -u root -p grand_slam < sql/seed.sql
--
-- Se corre una vez, sobre la base recien creada con sql/schema.sql (y despues
-- de sql/auth.sql). Para recargar de cero, borrar y volver a crear el esquema,
-- o descomentar el bloque de limpieza de mas abajo.
--
-- Sobre los datos: los jugadores, arbitros, torneos y sedes son reales, y estan
-- puestos para poder verificar los 9 ejemplos de la consigna (ver
-- sql/verificacion.sql). Los montos de los premios, los partidos de dobles
-- mixtos y los entrenadores de prueba son inventados: estan elegidos para que
-- los ejemplos den los numeros que pide la consigna. periodo_activo y
-- ganancias quedan sin cargar (son columnas fuera del modelo, se completan
-- desde el frontend).
-- ============================================================================
SET NAMES utf8mb4;
USE grand_slam;

-- Limpieza para recargar (descomentar si hace falta):
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE resultado_set; TRUNCATE TABLE partido_jugador; TRUNCATE TABLE partido;
-- TRUNCATE TABLE premio; TRUNCATE TABLE jugador_entrenador; TRUNCATE TABLE jugador_pais;
-- TRUNCATE TABLE edicion; TRUNCATE TABLE sede; TRUNCATE TABLE torneo;
-- TRUNCATE TABLE jugador; TRUNCATE TABLE arbitro; TRUNCATE TABLE entrenador; TRUNCATE TABLE pais;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- pais
-- ----------------------------------------------------------------------------
INSERT INTO pais (id_pais, nombre) VALUES
  (1, 'Estados Unidos'),
  (2, 'Francia'),
  (3, 'Gran Bretaña'),
  (4, 'Australia'),
  (5, 'Alemania'),
  (6, 'Suecia'),
  (7, 'Checoslovaquia'),
  (8, 'Paraguay'),
  (9, 'Argentina');

-- ----------------------------------------------------------------------------
-- torneo: los 4 del Grand Slam. El pais no va aca: cuelga de la sede.
-- ----------------------------------------------------------------------------
INSERT INTO torneo (id_torneo, nombre) VALUES
  (1, 'Australian Open'),
  (2, 'Roland Garros'),
  (3, 'Wimbledon'),
  (4, 'US Open');

-- ----------------------------------------------------------------------------
-- sede: los lugares donde se juega, por pais
-- ----------------------------------------------------------------------------
INSERT INTO sede (id_sede, nombre, pais_id_pais) VALUES
  (1, 'Melbourne Park',   4),
  (2, 'Kooyong',          4),
  (3, 'Roland Garros',    2),
  (4, 'Wimbledon',        3),
  (5, 'Forest Hills',     1),
  (6, 'Flushing Meadows', 1);

-- ----------------------------------------------------------------------------
-- edicion: el US Open cambia de sede (y de superficie) entre 1977 y 1978
-- ----------------------------------------------------------------------------
INSERT INTO edicion (id_edicion, anio, superficie, torneo_id_torneo, sede_id_sede) VALUES
  (1, 1979, 'polvo_ladrillo', 2, 3),   -- Roland Garros 1979
  (2, 1980, 'polvo_ladrillo', 2, 3),   -- Roland Garros 1980
  (3, 1987, 'polvo_ladrillo', 2, 3),   -- Roland Garros 1987
  (4, 1986, 'cesped',         3, 4),   -- Wimbledon 1986
  (5, 1991, 'cesped',         3, 4),   -- Wimbledon 1991
  (6, 1977, 'polvo_ladrillo', 4, 5),   -- US Open 1977 en Forest Hills (Har-Tru)
  (7, 1978, 'dura',           4, 6),   -- US Open 1978 en Flushing Meadows (paso a cancha dura)
  (8, 1985, 'cesped',         1, 2),   -- Australian Open 1985 en Kooyong (cesped hasta 1987)
  (9, 1985, 'dura',           4, 6);   -- US Open 1985 en Flushing Meadows

-- ----------------------------------------------------------------------------
-- jugador. Gomez queda apatrida (sin filas en jugador_pais) y Navratilova con
-- doble nacionalidad.
-- ----------------------------------------------------------------------------
INSERT INTO jugador (id_jugador, nombre, apellido, sexo) VALUES
  (1,  'Björn',   'Borg',        'M'),
  (2,  'Jimmy',   'Connors',     'M'),
  (3,  'Vitas',   'Gerulaitis',  'M'),
  (4,  'Víctor',  'Pecci',       'M'),
  (5,  'Ivan',    'Lendl',       'M'),
  (6,  'Mats',    'Wilander',    'M'),
  (7,  'Boris',   'Becker',      'M'),
  (8,  'Michael', 'Stich',       'M'),
  (9,  'Yannick', 'Noah',        'M'),
  (10, 'Hana',    'Mandlikova',  'F'),
  (11, 'Martina', 'Navratilova', 'F'),
  (12, 'Ana',     'Pérez',       'F'),
  (13, 'Lucía',   'Gómez',       'F');

INSERT INTO jugador_pais (jugador_id_jugador, pais_id_pais) VALUES
  (1, 6), (2, 1), (3, 1), (4, 8), (5, 7), (6, 6), (7, 5), (8, 5), (9, 2), (10, 7),
  (11, 1), (11, 7),   -- doble nacionalidad
  (12, 9);
  -- 13 (Gómez) no tiene ninguna: es apatrida

-- ----------------------------------------------------------------------------
-- arbitro y entrenador
-- ----------------------------------------------------------------------------
-- Los ids arrancan en 2: el 1 esta reservado para el arbitro placeholder
-- ('No hay registro'), que ya esta cargado en la base.
INSERT INTO arbitro (id_arbitro, nombre, apellido) VALUES
  (2, 'John',  'Wilkinson'),
  (3, 'Peter', 'Bell'),
  (4, 'Marie', 'Dubois');

INSERT INTO entrenador (id_entrenador, nombre, apellido) VALUES
  (1, 'Lennart', 'Bergelin'),
  (2, 'Pablo',   'Ruiz'),
  (3, 'Marta',   'Díaz'),
  (4, 'Sofía',   'Lima');

-- Perez tuvo 3 entrenadores distintos en 4 periodos, y Ruiz volvio a entrenarla
INSERT INTO jugador_entrenador (jugador_id_jugador, entrenador_id_entrenador, fecha_inicio, fecha_fin) VALUES
  (1,  1, '1974-01-01', '1981-12-31'),
  (12, 2, '2018-01-01', '2019-06-30'),
  (12, 3, '2019-07-01', '2021-12-31'),
  (12, 2, '2022-01-01', '2023-12-31'),
  (12, 4, '2024-01-01', NULL);

-- ----------------------------------------------------------------------------
-- premio: por edicion, modalidad y fase. El campeon solo en la Final.
-- Los montos de Roland Garros 1979 y 1980 y del US Open 1978 estan puestos para
-- que las ganancias de Borg sumen exactamente 2.000.000 (ejemplo 7).
-- ----------------------------------------------------------------------------
INSERT INTO premio (edicion_id_edicion, modalidad, fase, monto_perdedor_usd, monto_campeon_usd) VALUES
  (1, 'individual-masculino', 'Cuartos',   50000.00,  NULL),
  (1, 'individual-masculino', 'Semifinal', 120000.00, NULL),
  (1, 'individual-masculino', 'Final',     300000.00, 1200000.00),
  (2, 'individual-masculino', 'Final',     200000.00, 700000.00),
  (7, 'individual-masculino', 'Final',     100000.00, 400000.00),
  (3, 'individual-masculino', 'Final',     10000.00,  20000.00),   -- ejemplo 8
  (4, 'individual-masculino', 'Final',     150000.00, 500000.00),
  (5, 'individual-masculino', 'Final',     160000.00, 550000.00),
  (8, 'dobles-mixto', 'Cuartos',   15000.00, NULL),
  (9, 'dobles-mixto', 'Octavos',   8000.00,  NULL),
  (4, 'dobles-mixto', 'Semifinal', 40000.00, NULL),
  (3, 'dobles-mixto', 'Cuartos',   12000.00, NULL);

-- ----------------------------------------------------------------------------
-- partido
-- ----------------------------------------------------------------------------
INSERT INTO partido (id_partido, fecha, fase, modalidad, estado, edicion_id_edicion, arbitro_id_arbitro) VALUES
  -- Roland Garros 1979
  (1, '1979-06-05', 'Cuartos',   'individual-masculino', 'jugado', 1, 2),  -- Connors a Gerulaitis, arbitro Wilkinson
  (2, '1979-06-08', 'Semifinal', 'individual-masculino', 'jugado', 1, 3),
  (3, '1979-06-10', 'Final',     'individual-masculino', 'jugado', 1, 3),
  -- Roland Garros 1980
  (4, '1980-06-08', 'Final',     'individual-masculino', 'jugado', 2, 3),
  -- US Open 1978
  (5, '1978-09-10', 'Final',     'individual-masculino', 'jugado', 7, 4),
  -- Roland Garros 1987 (ejemplo 8)
  (6, '1987-06-07', 'Final',     'individual-masculino', 'jugado', 3, 2),
  -- Wimbledon 1986 y 1991: dos finales ganadas por alemanes
  (7, '1986-07-06', 'Final',     'individual-masculino', 'jugado', 4, 4),
  (8, '1991-07-07', 'Final',     'individual-masculino', 'jugado', 5, 2),
  -- Dobles mixtos: Noah y Mandlikova jugaron 4 veces juntos (ejemplo 9)
  (9,  '1985-01-22', 'Cuartos',   'dobles-mixto', 'jugado',   8, 3),
  (10, '1985-09-03', 'Octavos',   'dobles-mixto', 'walkover', 9, 4),
  (11, '1986-07-04', 'Semifinal', 'dobles-mixto', 'abandono', 4, 2),
  (12, '1987-06-03', 'Cuartos',   'dobles-mixto', 'jugado',   3, 3);

-- ----------------------------------------------------------------------------
-- partido_jugador: 2 filas en individuales, 4 en dobles
-- ----------------------------------------------------------------------------
INSERT INTO partido_jugador (rol, partido_id_partido, jugador_id_jugador) VALUES
  ('ganador', 1, 2), ('perdedor', 1, 3),     -- Connors gano a Gerulaitis
  ('ganador', 2, 1), ('perdedor', 2, 2),     -- Borg gano a Connors
  ('ganador', 3, 1), ('perdedor', 3, 4),     -- Borg campeon en RG 1979
  ('ganador', 4, 1), ('perdedor', 4, 3),     -- Borg campeon en RG 1980
  ('ganador', 5, 2), ('perdedor', 5, 1),     -- Connors campeon en el US Open 1978
  ('ganador', 6, 5), ('perdedor', 6, 6),     -- Lendl campeon en RG 1987
  ('ganador', 7, 7), ('perdedor', 7, 5),     -- Becker campeon en Wimbledon 1986
  ('ganador', 8, 8), ('perdedor', 8, 7),     -- Stich campeon en Wimbledon 1991
  -- dobles mixtos: Noah + Mandlikova contra Lendl + Navratilova
  ('ganador', 9,  9), ('ganador', 9,  10), ('perdedor', 9,  5), ('perdedor', 9,  11),
  ('ganador', 10, 9), ('ganador', 10, 10), ('perdedor', 10, 5), ('perdedor', 10, 11),
  ('ganador', 11, 9), ('ganador', 11, 10), ('perdedor', 11, 5), ('perdedor', 11, 11),
  ('perdedor', 12, 9), ('perdedor', 12, 10), ('ganador', 12, 5), ('ganador', 12, 11);

-- ----------------------------------------------------------------------------
-- resultado_set: los games son del ganador y del perdedor del partido.
-- El partido 10 es walkover y no tiene sets; el 11 quedo por abandono.
-- ----------------------------------------------------------------------------
INSERT INTO resultado_set (partido_id_partido, nro_set, games_ganador_partido, games_perdedor_partido) VALUES
  (1, 1, 6, 3), (1, 2, 4, 6), (1, 3, 7, 5), (1, 4, 6, 0),   -- ejemplo 5: 6-3 / 4-6 / 7-5 / 6-0
  (2, 1, 6, 4), (2, 2, 6, 4), (2, 3, 6, 3),
  (3, 1, 6, 3), (3, 2, 6, 1), (3, 3, 6, 7), (3, 4, 6, 4),
  (4, 1, 6, 4), (4, 2, 6, 1), (4, 3, 6, 2),
  (5, 1, 6, 4), (5, 2, 6, 2), (5, 3, 6, 2),
  (6, 1, 7, 5), (6, 2, 6, 2), (6, 3, 3, 6), (6, 4, 7, 6),
  (7, 1, 6, 4), (7, 2, 6, 3), (7, 3, 7, 5),
  (8, 1, 6, 4), (8, 2, 7, 6), (8, 3, 6, 4),
  (9, 1, 6, 4), (9, 2, 6, 3),
  (11, 1, 6, 3), (11, 2, 3, 2),                              -- abandono: el segundo set quedo a medias
  (12, 1, 6, 7), (12, 2, 6, 4), (12, 3, 6, 2);
