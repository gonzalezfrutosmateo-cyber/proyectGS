-- ============================================================================
-- Datos de ejemplo de la base del Grand Slam
--
--   mysql -u root -p grand_slam < sql/seed.sql
--
-- Se corre una vez, sobre la base recien creada con sql/schema.sql.
-- Para recargar de cero, borrar y volver a crear el esquema, o descomentar el
-- bloque de limpieza de mas abajo.
--
-- Sobre los datos: los jugadores, arbitros, torneos y sedes son reales, y estan
-- puestos para poder verificar los 9 ejemplos de la consigna (ver
-- sql/verificacion.sql). Los montos de los premios, los partidos de dobles
-- mixtos y los entrenadores de prueba son inventados: estan elegidos para que
-- los ejemplos den los numeros que pide la consigna.
-- ============================================================================
SET NAMES utf8mb4;
USE grand_slam;

-- Limpieza para recargar (descomentar si hace falta):
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE RESULTADO_SET; TRUNCATE TABLE PARTIDO_JUGADOR; TRUNCATE TABLE PARTIDO;
-- TRUNCATE TABLE PREMIO; TRUNCATE TABLE ENTRENAMIENTO; TRUNCATE TABLE JUGADOR_PAIS;
-- TRUNCATE TABLE EDICION; TRUNCATE TABLE SEDE; TRUNCATE TABLE TORNEO;
-- TRUNCATE TABLE JUGADOR; TRUNCATE TABLE ARBITRO; TRUNCATE TABLE ENTRENADOR; TRUNCATE TABLE PAIS;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- PAIS
-- ----------------------------------------------------------------------------
INSERT INTO PAIS (id_pais, nombre) VALUES
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
-- TORNEO: los 4 del Grand Slam, con su pais
-- ----------------------------------------------------------------------------
INSERT INTO TORNEO (id_torneo, nombre, PAIS_id_pais) VALUES
  (1, 'Australian Open', 4),
  (2, 'Roland Garros',   2),
  (3, 'Wimbledon',       3),
  (4, 'US Open',         1);

-- ----------------------------------------------------------------------------
-- SEDE: los lugares donde se juega, por pais
-- ----------------------------------------------------------------------------
INSERT INTO SEDE (id_sede, nombre, PAIS_id_pais) VALUES
  (1, 'Melbourne Park',   4),
  (2, 'Kooyong',          4),
  (3, 'Roland Garros',    2),
  (4, 'Wimbledon',        3),
  (5, 'Forest Hills',     1),
  (6, 'Flushing Meadows', 1);

-- ----------------------------------------------------------------------------
-- EDICION: el US Open cambia de sede entre 1977 y 1978
-- ----------------------------------------------------------------------------
INSERT INTO EDICION (id_edicion, anio, TORNEO_id_torneo, SEDE_id_sede) VALUES
  (1, 1979, 2, 3),   -- Roland Garros 1979
  (2, 1980, 2, 3),   -- Roland Garros 1980
  (3, 1987, 2, 3),   -- Roland Garros 1987
  (4, 1986, 3, 4),   -- Wimbledon 1986
  (5, 1991, 3, 4),   -- Wimbledon 1991
  (6, 1977, 4, 5),   -- US Open 1977 en Forest Hills
  (7, 1978, 4, 6),   -- US Open 1978 en Flushing Meadows
  (8, 1985, 1, 2),   -- Australian Open 1985 en Kooyong
  (9, 1985, 4, 6);   -- US Open 1985 en Flushing Meadows

-- ----------------------------------------------------------------------------
-- JUGADOR. Gomez queda apatrida (sin filas en JUGADOR_PAIS) y Navratilova con
-- doble nacionalidad.
-- ----------------------------------------------------------------------------
INSERT INTO JUGADOR (id_jugador, nombre, apellido) VALUES
  (1,  'Björn',   'Borg'),
  (2,  'Jimmy',   'Connors'),
  (3,  'Vitas',   'Gerulaitis'),
  (4,  'Víctor',  'Pecci'),
  (5,  'Ivan',    'Lendl'),
  (6,  'Mats',    'Wilander'),
  (7,  'Boris',   'Becker'),
  (8,  'Michael', 'Stich'),
  (9,  'Yannick', 'Noah'),
  (10, 'Hana',    'Mandlikova'),
  (11, 'Martina', 'Navratilova'),
  (12, 'Ana',     'Pérez'),
  (13, 'Lucía',   'Gómez');

INSERT INTO JUGADOR_PAIS (JUGADOR_id_jugador, PAIS_id_pais) VALUES
  (1, 6), (2, 1), (3, 1), (4, 8), (5, 7), (6, 6), (7, 5), (8, 5), (9, 2), (10, 7),
  (11, 1), (11, 7),   -- doble nacionalidad
  (12, 9);
  -- 13 (Gómez) no tiene ninguna: es apatrida

-- ----------------------------------------------------------------------------
-- ARBITRO y ENTRENADOR
-- ----------------------------------------------------------------------------
INSERT INTO ARBITRO (id_arbitro, nombre, apellido) VALUES
  (1, 'John',  'Wilkinson'),
  (2, 'Peter', 'Bell'),
  (3, 'Marie', 'Dubois');

INSERT INTO ENTRENADOR (id_entrenador, nombre, apellido) VALUES
  (1, 'Lennart', 'Bergelin'),
  (2, 'Pablo',   'Ruiz'),
  (3, 'Marta',   'Díaz'),
  (4, 'Sofía',   'Lima');

-- Perez tuvo 3 entrenadores distintos en 4 periodos, y Ruiz volvio a entrenarla
INSERT INTO ENTRENAMIENTO (JUGADOR_id_jugador, ENTRENADOR_id_entrenador, fecha_inicio, fecha_fin) VALUES
  (1,  1, '1974-01-01', '1981-12-31'),
  (12, 2, '2018-01-01', '2019-06-30'),
  (12, 3, '2019-07-01', '2021-12-31'),
  (12, 2, '2022-01-01', '2023-12-31'),
  (12, 4, '2024-01-01', NULL);

-- ----------------------------------------------------------------------------
-- PREMIO: por edicion, modalidad y fase. El campeon solo en la Final.
-- Los montos de Roland Garros 1979 y 1980 y del US Open 1978 estan puestos para
-- que las ganancias de Borg sumen exactamente 2.000.000 (ejemplo 7).
-- ----------------------------------------------------------------------------
INSERT INTO PREMIO (EDICION_id_edicion, modalidad, fase, monto_perdedor, monto_campeon) VALUES
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
-- PARTIDO
-- ----------------------------------------------------------------------------
INSERT INTO PARTIDO (id_partido, fecha, fase, modalidad, estado, EDICION_id_edicion, ARBITRO_id_arbitro) VALUES
  -- Roland Garros 1979
  (1, '1979-06-05', 'Cuartos',   'individual-masculino', 'jugado', 1, 1),  -- Connors a Gerulaitis, arbitro Wilkinson
  (2, '1979-06-08', 'Semifinal', 'individual-masculino', 'jugado', 1, 2),
  (3, '1979-06-10', 'Final',     'individual-masculino', 'jugado', 1, 2),
  -- Roland Garros 1980
  (4, '1980-06-08', 'Final',     'individual-masculino', 'jugado', 2, 2),
  -- US Open 1978
  (5, '1978-09-10', 'Final',     'individual-masculino', 'jugado', 7, 3),
  -- Roland Garros 1987 (ejemplo 8)
  (6, '1987-06-07', 'Final',     'individual-masculino', 'jugado', 3, 1),
  -- Wimbledon 1986 y 1991: dos finales ganadas por alemanes
  (7, '1986-07-06', 'Final',     'individual-masculino', 'jugado', 4, 3),
  (8, '1991-07-07', 'Final',     'individual-masculino', 'jugado', 5, 1),
  -- Dobles mixtos: Noah y Mandlikova jugaron 4 veces juntos (ejemplo 9)
  (9,  '1985-01-22', 'Cuartos',   'dobles-mixto', 'jugado',   8, 2),
  (10, '1985-09-03', 'Octavos',   'dobles-mixto', 'walkover', 9, 3),
  (11, '1986-07-04', 'Semifinal', 'dobles-mixto', 'abandono', 4, 1),
  (12, '1987-06-03', 'Cuartos',   'dobles-mixto', 'jugado',   3, 2);

-- ----------------------------------------------------------------------------
-- PARTIDO_JUGADOR: 2 filas en individuales, 4 en dobles
-- ----------------------------------------------------------------------------
INSERT INTO PARTIDO_JUGADOR (rol, PARTIDO_id_partido, JUGADOR_id_jugador) VALUES
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
-- RESULTADO_SET: los games son del ganador y del perdedor del partido.
-- El partido 10 es walkover y no tiene sets; el 11 quedo por abandono.
-- ----------------------------------------------------------------------------
INSERT INTO RESULTADO_SET (PARTIDO_id_partido, nro_set, games_ganador, games_perdedor) VALUES
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
