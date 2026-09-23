-- ============================================================================
-- Esquema de la base del Grand Slam
--
--   mysql -u root -p < sql/schema.sql
--
-- Basado en el modelo basegs.mwb (MySQL Workbench). Reemplaza al esquema viejo
-- generado desde torneo.mwb (nombres en mayusculas, sin sexo/superficie/tiebreak).
-- Ademas de lo que trae basegs.mwb, JUGADOR suma dos columnas que no estan en
-- el modelo (periodo_activo, ganancias), agregadas a mano para el frontend.
-- Despues de correrlo van sql/auth.sql y sql/seed.sql.
-- ============================================================================
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS grand_slam DEFAULT CHARACTER SET utf8mb4;
USE grand_slam;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Table grand_slam.pais
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`pais` (
  `id_pais` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NULL,
  PRIMARY KEY (`id_pais`),
  UNIQUE INDEX `nombre_UNIQUE` (`nombre` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.torneo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`torneo` (
  `id_torneo` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `pais_id_pais` INT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_torneo`),
  INDEX `fk_torneo_pais_idx` (`pais_id_pais` ASC) VISIBLE,
  UNIQUE INDEX `nombre_UNIQUE` (`nombre` ASC) VISIBLE,
  CONSTRAINT `fk_torneo_pais`
    FOREIGN KEY (`pais_id_pais`)
    REFERENCES `grand_slam`.`pais` (`id_pais`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.sede
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`sede` (
  `id_sede` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(80) NOT NULL,
  `pais_id_pais` INT NOT NULL,
  PRIMARY KEY (`id_sede`),
  INDEX `fk_sede_pais_idx` (`pais_id_pais` ASC) VISIBLE,
  UNIQUE INDEX `pais_nombre_UNIQUE` (`pais_id_pais` ASC, `nombre` ASC) VISIBLE,
  CONSTRAINT `fk_sede_pais`
    FOREIGN KEY (`pais_id_pais`)
    REFERENCES `grand_slam`.`pais` (`id_pais`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.edicion
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`edicion` (
  `id_edicion` INT NOT NULL AUTO_INCREMENT,
  `anio` INT NOT NULL,
  `superficie` ENUM('cesped', 'polvo_ladrillo', 'dura') NOT NULL COMMENT 'Superficie de ESA edicion (ej: el Australian Open fue en cesped hasta 1987)',
  `torneo_id_torneo` INT NOT NULL,
  `sede_id_sede` INT NOT NULL,
  PRIMARY KEY (`id_edicion`),
  INDEX `fk_edicion_torneo_idx` (`torneo_id_torneo` ASC) VISIBLE,
  INDEX `fk_edicion_sede_idx` (`sede_id_sede` ASC) VISIBLE,
  UNIQUE INDEX `torneo_anio_UNIQUE` (`torneo_id_torneo` ASC, `anio` ASC) VISIBLE,
  CONSTRAINT `fk_edicion_torneo`
    FOREIGN KEY (`torneo_id_torneo`)
    REFERENCES `grand_slam`.`torneo` (`id_torneo`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_edicion_sede`
    FOREIGN KEY (`sede_id_sede`)
    REFERENCES `grand_slam`.`sede` (`id_sede`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.jugador
-- periodo_activo y ganancias no estan en basegs.mwb: se agregaron a mano para
-- que el frontend los siga mostrando.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`jugador` (
  `id_jugador` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido` VARCHAR(50) NOT NULL,
  `sexo` ENUM('M', 'F') NOT NULL COMMENT 'M = masculino, F = femenino. Se usa para validar la modalidad del partido',
  `periodo_activo` VARCHAR(30) NULL COMMENT 'Fuera del modelo basegs.mwb: agregado para el frontend',
  `ganancias` DECIMAL(14,2) NULL COMMENT 'Fuera del modelo basegs.mwb: agregado para el frontend',
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_jugador`),
  INDEX `apellido_idx` (`apellido` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.arbitro
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`arbitro` (
  `id_arbitro` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido` VARCHAR(50) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_arbitro`),
  INDEX `apellido_idx` (`apellido` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.entrenador
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`entrenador` (
  `id_entrenador` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido` VARCHAR(50) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_entrenador`),
  INDEX `apellido_idx` (`apellido` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.jugador_entrenador (antes ENTRENAMIENTO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`jugador_entrenador` (
  `jugador_id_jugador` INT NOT NULL,
  `entrenador_id_entrenador` INT NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NULL COMMENT 'NULL = lo sigue entrenando',
  PRIMARY KEY (`jugador_id_jugador`, `entrenador_id_entrenador`, `fecha_inicio`),
  INDEX `fk_jugador_entrenador_jugador_idx` (`jugador_id_jugador` ASC) VISIBLE,
  INDEX `fk_jugador_entrenador_entrenador_idx` (`entrenador_id_entrenador` ASC) VISIBLE,
  CONSTRAINT `fk_jugador_entrenador_jugador`
    FOREIGN KEY (`jugador_id_jugador`)
    REFERENCES `grand_slam`.`jugador` (`id_jugador`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_jugador_entrenador_entrenador`
    FOREIGN KEY (`entrenador_id_entrenador`)
    REFERENCES `grand_slam`.`entrenador` (`id_entrenador`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.partido
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`partido` (
  `id_partido` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `fase` ENUM('R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final') NOT NULL,
  `modalidad` ENUM('individual-masculino', 'individual-femenino', 'dobles-masculino', 'dobles-femenino', 'dobles-mixto') NOT NULL COMMENT 'Mismos valores que el select de modalidad de partidos.html',
  `estado` ENUM('jugado', 'abandono', 'walkover') NOT NULL DEFAULT 'jugado' COMMENT 'abandono = el perdedor se retiro (sets incompletos); walkover = no se jugo (sin sets)',
  `edicion_id_edicion` INT NOT NULL,
  `arbitro_id_arbitro` INT NOT NULL,
  PRIMARY KEY (`id_partido`),
  INDEX `fk_partido_edicion_idx` (`edicion_id_edicion` ASC) VISIBLE,
  INDEX `fk_partido_arbitro_idx` (`arbitro_id_arbitro` ASC) VISIBLE,
  CONSTRAINT `fk_partido_edicion`
    FOREIGN KEY (`edicion_id_edicion`)
    REFERENCES `grand_slam`.`edicion` (`id_edicion`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_partido_arbitro`
    FOREIGN KEY (`arbitro_id_arbitro`)
    REFERENCES `grand_slam`.`arbitro` (`id_arbitro`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.partido_jugador
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`partido_jugador` (
  `rol` ENUM('ganador', 'perdedor') NOT NULL,
  `partido_id_partido` INT NOT NULL,
  `jugador_id_jugador` INT NOT NULL,
  PRIMARY KEY (`partido_id_partido`, `jugador_id_jugador`),
  INDEX `fk_partido_jugador_partido_idx` (`partido_id_partido` ASC) VISIBLE,
  INDEX `fk_partido_jugador_jugador_idx` (`jugador_id_jugador` ASC) VISIBLE,
  CONSTRAINT `fk_partido_jugador_partido`
    FOREIGN KEY (`partido_id_partido`)
    REFERENCES `grand_slam`.`partido` (`id_partido`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_partido_jugador_jugador`
    FOREIGN KEY (`jugador_id_jugador`)
    REFERENCES `grand_slam`.`jugador` (`id_jugador`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.resultado_set
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`resultado_set` (
  `partido_id_partido` INT NOT NULL,
  `nro_set` TINYINT UNSIGNED NOT NULL COMMENT '1 a 5',
  `games_ganador_partido` TINYINT UNSIGNED NOT NULL COMMENT 'Games que hizo en este set quien GANO EL PARTIDO',
  `games_perdedor_partido` TINYINT UNSIGNED NOT NULL COMMENT 'Games que hizo en este set quien PERDIO EL PARTIDO',
  `tiebreak_perdedor` TINYINT UNSIGNED NULL COMMENT 'Puntos de quien PERDIO EL TIE-BREAK (el 5 de 7-6(5)). NULL = el set no tuvo tie-break',
  PRIMARY KEY (`partido_id_partido`, `nro_set`),
  INDEX `fk_resultado_set_partido_idx` (`partido_id_partido` ASC) VISIBLE,
  CONSTRAINT `fk_resultado_set_partido`
    FOREIGN KEY (`partido_id_partido`)
    REFERENCES `grand_slam`.`partido` (`id_partido`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.jugador_pais
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`jugador_pais` (
  `jugador_id_jugador` INT NOT NULL,
  `pais_id_pais` INT NOT NULL,
  PRIMARY KEY (`jugador_id_jugador`, `pais_id_pais`),
  INDEX `fk_jugador_pais_jugador_idx` (`jugador_id_jugador` ASC) VISIBLE,
  INDEX `fk_jugador_pais_pais_idx` (`pais_id_pais` ASC) VISIBLE,
  CONSTRAINT `fk_jugador_pais_jugador`
    FOREIGN KEY (`jugador_id_jugador`)
    REFERENCES `grand_slam`.`jugador` (`id_jugador`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_jugador_pais_pais`
    FOREIGN KEY (`pais_id_pais`)
    REFERENCES `grand_slam`.`pais` (`id_pais`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.premio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`premio` (
  `edicion_id_edicion` INT NOT NULL,
  `modalidad` ENUM('individual-masculino', 'individual-femenino', 'dobles-masculino', 'dobles-femenino', 'dobles-mixto') NOT NULL COMMENT 'Mismos valores que partido.modalidad',
  `fase` ENUM('R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final') NOT NULL COMMENT 'Mismos valores que partido.fase',
  `monto_perdedor_usd` DECIMAL(12,2) NOT NULL COMMENT 'USD. Premio de quien pierde en esta fase (en la Final = el finalista)',
  `monto_campeon_usd` DECIMAL(12,2) NULL COMMENT 'USD. Premio del campeon: solo en la fila de la Final, NULL en las demas fases',
  PRIMARY KEY (`edicion_id_edicion`, `modalidad`, `fase`),
  INDEX `fk_premio_edicion_idx` (`edicion_id_edicion` ASC) VISIBLE,
  CONSTRAINT `fk_premio_edicion`
    FOREIGN KEY (`edicion_id_edicion`)
    REFERENCES `grand_slam`.`edicion` (`id_edicion`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
