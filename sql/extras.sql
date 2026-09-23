-- ============================================================================
-- Columnas extra que NO estan en basegs.mwb
--
--   mysql -u root -p grand_slam < sql/extras.sql
--
-- El esquema sale del Forward Engineer de basegs.mwb, asi que estas dos
-- columnas no pueden vivir ahi: se agregan aparte, despues de crear el esquema.
-- Las usa el formulario de jugadores del front (Periodo Activo y Ganancias).
--
-- Si se regenera el esquema desde Workbench, hay que volver a correr este
-- archivo.
-- ============================================================================
USE grand_slam;

ALTER TABLE jugador
  ADD COLUMN periodo_activo VARCHAR(30) NULL COMMENT 'Fuera del modelo basegs.mwb: lo usa el front',
  ADD COLUMN ganancias DECIMAL(14,2) NULL COMMENT 'Fuera del modelo basegs.mwb: lo usa el front';
