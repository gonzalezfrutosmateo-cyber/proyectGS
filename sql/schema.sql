-- ============================================================================
-- Esquema de la base del Grand Slam
--
--   mysql -u root -p < sql/schema.sql
--
-- Generado con el Forward Engineer de torneo.mwb (MySQL Workbench 8.0.47).
-- No editarlo a mano: si cambia el modelo, se vuelve a generar.
-- Despues de correrlo van sql/roles.sql y sql/seed.sql.
-- ============================================================================
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS grand_slam DEFAULT CHARACTER SET utf8;
USE grand_slam;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Table grand_slam.PAIS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`PAIS` (
  `id_pais` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NULL,
  PRIMARY KEY (`id_pais`),
  UNIQUE INDEX `nombre_UNIQUE` (`nombre` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.TORNEO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`TORNEO` (
  `id_torneo` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `PAIS_id_pais` INT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_torneo`),
  INDEX `fk_TORNEO_PAIS_idx` (`PAIS_id_pais` ASC) VISIBLE,
  CONSTRAINT `fk_TORNEO_PAIS`
    FOREIGN KEY (`PAIS_id_pais`)
    REFERENCES `grand_slam`.`PAIS` (`id_pais`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.SEDE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`SEDE` (
  `id_sede` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(80) NOT NULL,
  `PAIS_id_pais` INT NOT NULL,
  PRIMARY KEY (`id_sede`),
  INDEX `fk_SEDE_PAIS1_idx` (`PAIS_id_pais` ASC) VISIBLE,
  UNIQUE INDEX `pais_nombre_UNIQUE` (`PAIS_id_pais` ASC, `nombre` ASC) VISIBLE,
  CONSTRAINT `fk_SEDE_PAIS1`
    FOREIGN KEY (`PAIS_id_pais`)
    REFERENCES `grand_slam`.`PAIS` (`id_pais`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.EDICION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`EDICION` (
  `id_edicion` INT NOT NULL AUTO_INCREMENT,
  `anio` INT NOT NULL,
  `TORNEO_id_torneo` INT NOT NULL,
  `SEDE_id_sede` INT NOT NULL,
  PRIMARY KEY (`id_edicion`),
  INDEX `fk_EDICION_TORNEO1_idx` (`TORNEO_id_torneo` ASC) VISIBLE,
  INDEX `fk_EDICION_SEDE1_idx` (`SEDE_id_sede` ASC) VISIBLE,
  UNIQUE INDEX `torneo_anio_UNIQUE` (`TORNEO_id_torneo` ASC, `anio` ASC) VISIBLE,
  CONSTRAINT `fk_EDICION_TORNEO1`
    FOREIGN KEY (`TORNEO_id_torneo`)
    REFERENCES `grand_slam`.`TORNEO` (`id_torneo`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_EDICION_SEDE1`
    FOREIGN KEY (`SEDE_id_sede`)
    REFERENCES `grand_slam`.`SEDE` (`id_sede`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.JUGADOR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`JUGADOR` (
  `id_jugador` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido` VARCHAR(50) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_jugador`),
  INDEX `apellido_idx` (`apellido` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.ARBITRO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`ARBITRO` (
  `id_arbitro` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido` VARCHAR(50) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_arbitro`),
  INDEX `apellido_idx` (`apellido` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.ENTRENADOR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`ENTRENADOR` (
  `id_entrenador` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `apellido` VARCHAR(50) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Baja logica: 0 = dado de baja. No sale en los listados, pero la historia queda',
  PRIMARY KEY (`id_entrenador`),
  INDEX `apellido_idx` (`apellido` ASC) VISIBLE)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.ENTRENAMIENTO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`ENTRENAMIENTO` (
  `JUGADOR_id_jugador` INT NOT NULL,
  `ENTRENADOR_id_entrenador` INT NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NULL COMMENT 'NULL = lo sigue entrenando',
  PRIMARY KEY (`JUGADOR_id_jugador`, `ENTRENADOR_id_entrenador`, `fecha_inicio`),
  INDEX `fk_ENTRENAMIENTO_JUGADOR1_idx` (`JUGADOR_id_jugador` ASC) VISIBLE,
  INDEX `fk_ENTRENAMIENTO_ENTRENADOR1_idx` (`ENTRENADOR_id_entrenador` ASC) VISIBLE,
  CONSTRAINT `fk_ENTRENAMIENTO_JUGADOR1`
    FOREIGN KEY (`JUGADOR_id_jugador`)
    REFERENCES `grand_slam`.`JUGADOR` (`id_jugador`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_ENTRENAMIENTO_ENTRENADOR1`
    FOREIGN KEY (`ENTRENADOR_id_entrenador`)
    REFERENCES `grand_slam`.`ENTRENADOR` (`id_entrenador`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.PARTIDO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`PARTIDO` (
  `id_partido` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `fase` ENUM('R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final') NOT NULL,
  `modalidad` ENUM('individual-masculino', 'individual-femenino', 'dobles-masculino', 'dobles-femenino', 'dobles-mixto') NOT NULL COMMENT 'Mismos valores que el select de modalidad de partidos.html',
  `estado` ENUM('jugado', 'abandono', 'walkover') NOT NULL DEFAULT 'jugado' COMMENT 'abandono = el perdedor se retiro (sets incompletos); walkover = no se jugo (sin sets)',
  `EDICION_id_edicion` INT NOT NULL,
  `ARBITRO_id_arbitro` INT NOT NULL,
  PRIMARY KEY (`id_partido`),
  INDEX `fk_PARTIDO_EDICION1_idx` (`EDICION_id_edicion` ASC) VISIBLE,
  INDEX `fk_PARTIDO_ARBITRO1_idx` (`ARBITRO_id_arbitro` ASC) VISIBLE,
  CONSTRAINT `fk_PARTIDO_EDICION1`
    FOREIGN KEY (`EDICION_id_edicion`)
    REFERENCES `grand_slam`.`EDICION` (`id_edicion`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_PARTIDO_ARBITRO1`
    FOREIGN KEY (`ARBITRO_id_arbitro`)
    REFERENCES `grand_slam`.`ARBITRO` (`id_arbitro`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.PARTIDO_JUGADOR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`PARTIDO_JUGADOR` (
  `rol` ENUM('ganador', 'perdedor') NOT NULL,
  `PARTIDO_id_partido` INT NOT NULL,
  `JUGADOR_id_jugador` INT NOT NULL,
  PRIMARY KEY (`PARTIDO_id_partido`, `JUGADOR_id_jugador`),
  INDEX `fk_PARTIDO_JUGADOR_PARTIDO1_idx` (`PARTIDO_id_partido` ASC) VISIBLE,
  INDEX `fk_PARTIDO_JUGADOR_JUGADOR1_idx` (`JUGADOR_id_jugador` ASC) VISIBLE,
  CONSTRAINT `fk_PARTIDO_JUGADOR_PARTIDO1`
    FOREIGN KEY (`PARTIDO_id_partido`)
    REFERENCES `grand_slam`.`PARTIDO` (`id_partido`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_PARTIDO_JUGADOR_JUGADOR1`
    FOREIGN KEY (`JUGADOR_id_jugador`)
    REFERENCES `grand_slam`.`JUGADOR` (`id_jugador`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.RESULTADO_SET
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`RESULTADO_SET` (
  `PARTIDO_id_partido` INT NOT NULL,
  `nro_set` TINYINT NOT NULL,
  `games_ganador` TINYINT NOT NULL,
  `games_perdedor` TINYINT NOT NULL,
  PRIMARY KEY (`PARTIDO_id_partido`, `nro_set`),
  INDEX `fk_RESULTADO_SET_PARTIDO1_idx` (`PARTIDO_id_partido` ASC) VISIBLE,
  CONSTRAINT `fk_RESULTADO_SET_PARTIDO1`
    FOREIGN KEY (`PARTIDO_id_partido`)
    REFERENCES `grand_slam`.`PARTIDO` (`id_partido`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.JUGADOR_PAIS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`JUGADOR_PAIS` (
  `JUGADOR_id_jugador` INT NOT NULL,
  `PAIS_id_pais` INT NOT NULL,
  PRIMARY KEY (`JUGADOR_id_jugador`, `PAIS_id_pais`),
  INDEX `fk_JUGADOR_PAIS_JUGADOR1_idx` (`JUGADOR_id_jugador` ASC) VISIBLE,
  INDEX `fk_JUGADOR_PAIS_PAIS1_idx` (`PAIS_id_pais` ASC) VISIBLE,
  CONSTRAINT `fk_JUGADOR_PAIS_JUGADOR1`
    FOREIGN KEY (`JUGADOR_id_jugador`)
    REFERENCES `grand_slam`.`JUGADOR` (`id_jugador`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_JUGADOR_PAIS_PAIS1`
    FOREIGN KEY (`PAIS_id_pais`)
    REFERENCES `grand_slam`.`PAIS` (`id_pais`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- Table grand_slam.PREMIO
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grand_slam`.`PREMIO` (
  `EDICION_id_edicion` INT NOT NULL,
  `modalidad` ENUM('individual-masculino', 'individual-femenino', 'dobles-masculino', 'dobles-femenino', 'dobles-mixto') NOT NULL COMMENT 'Mismos valores que PARTIDO.modalidad',
  `fase` ENUM('R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final') NOT NULL COMMENT 'Mismos valores que PARTIDO.fase',
  `monto_perdedor` DECIMAL(12,2) NOT NULL COMMENT 'Premio del que pierde un partido de esta fase',
  `monto_campeon` DECIMAL(12,2) NULL COMMENT 'Premio del campeon: solo en la fila de la Final, NULL en las demas fases',
  PRIMARY KEY (`EDICION_id_edicion`, `modalidad`, `fase`),
  INDEX `fk_PREMIO_EDICION1_idx` (`EDICION_id_edicion` ASC) VISIBLE,
  CONSTRAINT `fk_PREMIO_EDICION1`
    FOREIGN KEY (`EDICION_id_edicion`)
    REFERENCES `grand_slam`.`EDICION` (`id_edicion`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT)
ENGINE = InnoDB;
SET FOREIGN_KEY_CHECKS = 1;
