-- ============================================================================
-- Usuarios de la aplicacion (login)
--
--   mysql -u root -p grand_slam < sql/auth.sql
--
-- Se corre una vez, despues de sql/schema.sql. Esta tabla no forma parte del
-- modelo del torneo (no esta en basegs.mwb): es solo para el login del front.
--
-- password_hash NO es un hash de verdad: es btoa(password) (Base64), calculado
-- en el navegador antes de mandarlo. No hay seguridad real aca a proposito
-- (es un trabajo academico corrido en local) - el backend guarda y compara
-- ese valor tal cual, sin volver a hashear.
--
-- Usuarios de prueba: nombre de usuario y contraseña son el mismo texto que el
-- rol (usuario/usuario, arbitro/arbitro, admin/admin).
-- ============================================================================
USE grand_slam;

CREATE TABLE IF NOT EXISTS `grand_slam`.`usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre_usuario` VARCHAR(40) NOT NULL,
  `password_hash` VARCHAR(20) NOT NULL,
  `rol` ENUM('usuario', 'arbitro', 'admin') NOT NULL DEFAULT 'usuario',
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `nombre_usuario_UNIQUE` (`nombre_usuario` ASC)
) ENGINE = InnoDB;

INSERT INTO usuario (nombre_usuario, password_hash, rol) VALUES
  ('usuario', 'dXN1YXJpbw==', 'usuario'),
  ('arbitro', 'YXJiaXRybw==', 'arbitro'),
  ('admin',   'YWRtaW4=',     'admin');
