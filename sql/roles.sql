-- ============================================================================
-- Roles y permisos de la base del Grand Slam
--
-- Se ejecuta UNA vez, como root, despues de crear el esquema con el Forward
-- Engineer de torneo.mwb.
--
-- Requiere MySQL 8.0 o superior, que es donde existen los roles. Al final esta
-- la version equivalente para MySQL 5.7, que no tiene CREATE ROLE.
--
-- El esquema del modelo se llama `torne`. Si se renombra, cambiarlo aca tambien.
--
-- IMPORTANTE: las claves de este archivo son un marcador de posicion.
-- Cambiarlas antes de ejecutar y NO commitear la clave real: va en el .env del
-- backend (ver task #22).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Roles
-- ----------------------------------------------------------------------------
CREATE ROLE IF NOT EXISTS 'gs_consulta', 'gs_carga', 'gs_admin';

-- Solo lectura: las paginas publicas de consulta
GRANT SELECT ON `torne`.* TO 'gs_consulta';

-- Carga: altas y modificaciones de torneos, jugadores, partidos y resultados.
-- No tiene DELETE: las bajas son logicas (UPDATE activo = 0), segun la politica
-- de bajas de la task #11.
GRANT SELECT, INSERT, UPDATE ON `torne`.* TO 'gs_carga';

-- Admin: todo, incluido DELETE y el mantenimiento del esquema
GRANT ALL PRIVILEGES ON `torne`.* TO 'gs_admin';

-- ----------------------------------------------------------------------------
-- 2. Usuarios
-- ----------------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'web_consulta'@'localhost' IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';
CREATE USER IF NOT EXISTS 'app_carga'@'localhost'    IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';
CREATE USER IF NOT EXISTS 'gs_dba'@'localhost'       IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';

GRANT 'gs_consulta' TO 'web_consulta'@'localhost';
GRANT 'gs_carga'    TO 'app_carga'@'localhost';
GRANT 'gs_admin'    TO 'gs_dba'@'localhost';

-- Con esto el rol queda activo al conectarse y no hace falta un SET ROLE
SET DEFAULT ROLE ALL TO 'web_consulta'@'localhost', 'app_carga'@'localhost', 'gs_dba'@'localhost';

FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------
-- 3. Control: que quedo con que permiso
-- ----------------------------------------------------------------------------
-- SHOW GRANTS FOR 'gs_consulta';
-- SHOW GRANTS FOR 'gs_carga';
-- SHOW GRANTS FOR 'gs_admin';
-- SHOW GRANTS FOR 'app_carga'@'localhost' USING 'gs_carga';

-- ----------------------------------------------------------------------------
-- 4. Alternativa para MySQL 5.7 (sin roles): los permisos van al usuario
-- ----------------------------------------------------------------------------
/*
CREATE USER 'web_consulta'@'localhost' IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';
CREATE USER 'app_carga'@'localhost'    IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';
CREATE USER 'gs_dba'@'localhost'       IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';

GRANT SELECT                 ON `torne`.* TO 'web_consulta'@'localhost';
GRANT SELECT, INSERT, UPDATE ON `torne`.* TO 'app_carga'@'localhost';
GRANT ALL PRIVILEGES         ON `torne`.* TO 'gs_dba'@'localhost';

FLUSH PRIVILEGES;
*/
