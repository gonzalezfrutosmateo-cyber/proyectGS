-- =========================================================
-- Base de datos del proyecto Grand Slam
-- (estructura + las dos modalidades base: Individual y Dobles)
--
-- OJO: este script BORRA la base grand_slam si ya existe
-- y la crea de nuevo. Se pierden los datos cargados.
--
-- Cambio respecto a la versión anterior:
--   modalidades.jugadores_por_lado -> 1 = individual (1 vs 1), 2 = dobles (2 vs 2)
-- =========================================================

DROP DATABASE IF EXISTS grand_slam;
CREATE DATABASE grand_slam DEFAULT CHARACTER SET utf8mb4;
USE grand_slam;

-- ---------- Tablas sin dependencias ----------

CREATE TABLE paises (
    id_pais INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_pais)
);

CREATE TABLE arbitros (
    id_arbitro INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_arbitro)
);

CREATE TABLE modalidades (
    id_modalidad INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    -- Cuántos jugadores hay de cada lado: 1 (individual) o 2 (dobles)
    jugadores_por_lado TINYINT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_modalidad)
);

CREATE TABLE jugadores (
    id_jugador INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_jugador)
);

CREATE TABLE entrenadores (
    id_entrenador INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_entrenador)
);

-- ---------- Sedes y torneos ----------

CREATE TABLE sedes (
    id_sede INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    id_pais INT DEFAULT NULL,
    PRIMARY KEY (id_sede),
    FOREIGN KEY (id_pais) REFERENCES paises (id_pais)
);

CREATE TABLE torneos (
    id_torneo INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    anio INT NOT NULL,
    id_sede INT DEFAULT NULL,
    PRIMARY KEY (id_torneo),
    FOREIGN KEY (id_sede) REFERENCES sedes (id_sede)
);

CREATE TABLE premios (
    id_premio INT NOT NULL AUTO_INCREMENT,
    id_torneo INT DEFAULT NULL,
    fase VARCHAR(50) NOT NULL,
    monto_ganador DECIMAL(10,2) NOT NULL,
    monto_perdedor DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_premio),
    FOREIGN KEY (id_torneo) REFERENCES torneos (id_torneo)
);

-- ---------- Relaciones de jugadores ----------

CREATE TABLE jugador_nacionalidad (
    id_jugador INT NOT NULL,
    id_pais INT NOT NULL,
    PRIMARY KEY (id_jugador, id_pais),
    FOREIGN KEY (id_jugador) REFERENCES jugadores (id_jugador) ON DELETE CASCADE,
    FOREIGN KEY (id_pais) REFERENCES paises (id_pais) ON DELETE CASCADE
);

-- Un entrenamiento sin fecha_fin es el que sigue activo
CREATE TABLE jugador_entrenador (
    id_jugador INT NOT NULL,
    id_entrenador INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE DEFAULT NULL,
    PRIMARY KEY (id_jugador, id_entrenador, fecha_inicio),
    FOREIGN KEY (id_jugador) REFERENCES jugadores (id_jugador) ON DELETE CASCADE,
    FOREIGN KEY (id_entrenador) REFERENCES entrenadores (id_entrenador) ON DELETE CASCADE
);

-- ---------- Partidos ----------

CREATE TABLE partidos (
    id_partido INT NOT NULL AUTO_INCREMENT,
    id_torneo INT DEFAULT NULL,
    id_modalidad INT DEFAULT NULL,
    id_arbitro INT DEFAULT NULL,
    fase VARCHAR(50) NOT NULL,
    resultado VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (id_partido),
    FOREIGN KEY (id_torneo) REFERENCES torneos (id_torneo),
    FOREIGN KEY (id_modalidad) REFERENCES modalidades (id_modalidad),
    FOREIGN KEY (id_arbitro) REFERENCES arbitros (id_arbitro)
);

-- Cada jugador que jugó un partido, con 1 si ganó o 0 si perdió.
-- Al borrar un partido se borran solas sus participaciones (ON DELETE CASCADE).
CREATE TABLE participaciones_partidos (
    id_partido INT NOT NULL,
    id_jugador INT NOT NULL,
    es_ganador TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_partido, id_jugador),
    FOREIGN KEY (id_partido) REFERENCES partidos (id_partido) ON DELETE CASCADE,
    FOREIGN KEY (id_jugador) REFERENCES jugadores (id_jugador) ON DELETE CASCADE
);

-- ---------- Datos iniciales ----------

INSERT INTO modalidades (nombre, jugadores_por_lado) VALUES
    ('Individual', 1),
    ('Dobles', 2);
