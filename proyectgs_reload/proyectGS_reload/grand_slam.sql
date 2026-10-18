-- =====================================================================
--  Base de datos grand_slam (Grand History)
--  Armada a partir del modelo torneo.mwb de MySQL Workbench.
--
--  Ejecutar SOLO si todavía no tienen la base creada (por ejemplo en
--  otra compu). Si ya la tienen, no hace falta: la app usa la misma.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS grand_slam DEFAULT CHARACTER SET utf8mb4;
USE grand_slam;

CREATE TABLE IF NOT EXISTS PAIS (
    id_pais INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(60) NULL,
    PRIMARY KEY (id_pais),
    UNIQUE INDEX nombre_UNIQUE (nombre)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS TORNEO (
    id_torneo INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(60) NOT NULL,
    PAIS_id_pais INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_torneo),
    INDEX fk_TORNEO_PAIS_idx (PAIS_id_pais),
    CONSTRAINT fk_TORNEO_PAIS FOREIGN KEY (PAIS_id_pais)
        REFERENCES PAIS (id_pais) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS SEDE (
    id_sede INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(80) NOT NULL,
    PAIS_id_pais INT NOT NULL,
    PRIMARY KEY (id_sede),
    INDEX fk_SEDE_PAIS1_idx (PAIS_id_pais),
    UNIQUE INDEX pais_nombre_UNIQUE (PAIS_id_pais, nombre),
    CONSTRAINT fk_SEDE_PAIS1 FOREIGN KEY (PAIS_id_pais)
        REFERENCES PAIS (id_pais) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS EDICION (
    id_edicion INT NOT NULL AUTO_INCREMENT,
    anio INT NOT NULL,
    TORNEO_id_torneo INT NOT NULL,
    SEDE_id_sede INT NOT NULL,
    PRIMARY KEY (id_edicion),
    INDEX fk_EDICION_TORNEO1_idx (TORNEO_id_torneo),
    INDEX fk_EDICION_SEDE1_idx (SEDE_id_sede),
    UNIQUE INDEX torneo_anio_UNIQUE (TORNEO_id_torneo, anio),
    CONSTRAINT fk_EDICION_TORNEO1 FOREIGN KEY (TORNEO_id_torneo)
        REFERENCES TORNEO (id_torneo) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_EDICION_SEDE1 FOREIGN KEY (SEDE_id_sede)
        REFERENCES SEDE (id_sede) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS JUGADOR (
    id_jugador INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    periodo_activo VARCHAR(20) NOT NULL,
    ganancias DECIMAL(12,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_jugador),
    INDEX apellido_idx (apellido)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS ARBITRO (
    id_arbitro INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_arbitro),
    INDEX apellido_idx (apellido)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS ENTRENADOR (
    id_entrenador INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_entrenador),
    INDEX apellido_idx (apellido)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS ENTRENAMIENTO (
    JUGADOR_id_jugador INT NOT NULL,
    ENTRENADOR_id_entrenador INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    PRIMARY KEY (JUGADOR_id_jugador, ENTRENADOR_id_entrenador, fecha_inicio),
    INDEX fk_ENTRENAMIENTO_JUGADOR1_idx (JUGADOR_id_jugador),
    INDEX fk_ENTRENAMIENTO_ENTRENADOR1_idx (ENTRENADOR_id_entrenador),
    CONSTRAINT fk_ENTRENAMIENTO_JUGADOR1 FOREIGN KEY (JUGADOR_id_jugador)
        REFERENCES JUGADOR (id_jugador) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_ENTRENAMIENTO_ENTRENADOR1 FOREIGN KEY (ENTRENADOR_id_entrenador)
        REFERENCES ENTRENADOR (id_entrenador) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS PARTIDO (
    id_partido INT NOT NULL AUTO_INCREMENT,
    fecha DATE NOT NULL,
    fase ENUM('R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final') NOT NULL,
    modalidad ENUM('individual-masculino', 'individual-femenino', 'dobles-masculino', 'dobles-femenino', 'dobles-mixto') NOT NULL,
    estado ENUM('jugado', 'abandono', 'walkover') NOT NULL DEFAULT 'jugado',
    EDICION_id_edicion INT NOT NULL,
    ARBITRO_id_arbitro INT NOT NULL,
    PRIMARY KEY (id_partido),
    INDEX fk_PARTIDO_EDICION1_idx (EDICION_id_edicion),
    INDEX fk_PARTIDO_ARBITRO1_idx (ARBITRO_id_arbitro),
    CONSTRAINT fk_PARTIDO_EDICION1 FOREIGN KEY (EDICION_id_edicion)
        REFERENCES EDICION (id_edicion) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_PARTIDO_ARBITRO1 FOREIGN KEY (ARBITRO_id_arbitro)
        REFERENCES ARBITRO (id_arbitro) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS PARTIDO_JUGADOR (
    rol ENUM('ganador', 'perdedor') NOT NULL,
    PARTIDO_id_partido INT NOT NULL,
    JUGADOR_id_jugador INT NOT NULL,
    PRIMARY KEY (PARTIDO_id_partido, JUGADOR_id_jugador),
    INDEX fk_PARTIDO_JUGADOR_PARTIDO1_idx (PARTIDO_id_partido),
    INDEX fk_PARTIDO_JUGADOR_JUGADOR1_idx (JUGADOR_id_jugador),
    CONSTRAINT fk_PARTIDO_JUGADOR_PARTIDO1 FOREIGN KEY (PARTIDO_id_partido)
        REFERENCES PARTIDO (id_partido) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_PARTIDO_JUGADOR_JUGADOR1 FOREIGN KEY (JUGADOR_id_jugador)
        REFERENCES JUGADOR (id_jugador) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS RESULTADO_SET (
    PARTIDO_id_partido INT NOT NULL,
    nro_set TINYINT NOT NULL,
    games_ganador TINYINT NOT NULL,
    games_perdedor TINYINT NOT NULL,
    PRIMARY KEY (PARTIDO_id_partido, nro_set),
    INDEX fk_RESULTADO_SET_PARTIDO1_idx (PARTIDO_id_partido),
    CONSTRAINT fk_RESULTADO_SET_PARTIDO1 FOREIGN KEY (PARTIDO_id_partido)
        REFERENCES PARTIDO (id_partido) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS JUGADOR_PAIS (
    JUGADOR_id_jugador INT NOT NULL,
    PAIS_id_pais INT NOT NULL,
    PRIMARY KEY (JUGADOR_id_jugador, PAIS_id_pais),
    INDEX fk_JUGADOR_PAIS_JUGADOR1_idx (JUGADOR_id_jugador),
    INDEX fk_JUGADOR_PAIS_PAIS1_idx (PAIS_id_pais),
    CONSTRAINT fk_JUGADOR_PAIS_JUGADOR1 FOREIGN KEY (JUGADOR_id_jugador)
        REFERENCES JUGADOR (id_jugador) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_JUGADOR_PAIS_PAIS1 FOREIGN KEY (PAIS_id_pais)
        REFERENCES PAIS (id_pais) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS PREMIO (
    EDICION_id_edicion INT NOT NULL,
    modalidad ENUM('individual-masculino', 'individual-femenino', 'dobles-masculino', 'dobles-femenino', 'dobles-mixto') NOT NULL,
    fase ENUM('R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final') NOT NULL,
    monto_perdedor DECIMAL(12,2) NOT NULL,
    monto_campeon DECIMAL(12,2) NULL,
    PRIMARY KEY (EDICION_id_edicion, modalidad, fase),
    INDEX fk_PREMIO_EDICION1_idx (EDICION_id_edicion),
    CONSTRAINT fk_PREMIO_EDICION1 FOREIGN KEY (EDICION_id_edicion)
        REFERENCES EDICION (id_edicion) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB;


-- =====================================================================
--  Datos iniciales: los 4 Grand Slam y los datos que antes estaban
--  escritos a mano en scriptJugador.js, scriptEntrenador.js y
--  scriptArbitro.js
-- =====================================================================

INSERT INTO PAIS (nombre) VALUES
    ('Argentina'), ('Australia'), ('España'), ('Estados Unidos'),
    ('Francia'), ('Gran Bretaña'), ('Serbia'), ('Suiza');

INSERT INTO TORNEO (nombre, PAIS_id_pais)
    SELECT 'Wimbledon', id_pais FROM PAIS WHERE nombre = 'Gran Bretaña';
INSERT INTO TORNEO (nombre, PAIS_id_pais)
    SELECT 'US Open', id_pais FROM PAIS WHERE nombre = 'Estados Unidos';
INSERT INTO TORNEO (nombre, PAIS_id_pais)
    SELECT 'Roland Garros', id_pais FROM PAIS WHERE nombre = 'Francia';
INSERT INTO TORNEO (nombre, PAIS_id_pais)
    SELECT 'Australian Open', id_pais FROM PAIS WHERE nombre = 'Australia';

INSERT INTO SEDE (nombre, PAIS_id_pais)
    SELECT 'All England Club', id_pais FROM PAIS WHERE nombre = 'Gran Bretaña';
INSERT INTO SEDE (nombre, PAIS_id_pais)
    SELECT 'Forest Hills', id_pais FROM PAIS WHERE nombre = 'Estados Unidos';
INSERT INTO SEDE (nombre, PAIS_id_pais)
    SELECT 'Flushing Meadows', id_pais FROM PAIS WHERE nombre = 'Estados Unidos';
INSERT INTO SEDE (nombre, PAIS_id_pais)
    SELECT 'Stade Roland Garros', id_pais FROM PAIS WHERE nombre = 'Francia';
INSERT INTO SEDE (nombre, PAIS_id_pais)
    SELECT 'Melbourne Park', id_pais FROM PAIS WHERE nombre = 'Australia';

INSERT INTO JUGADOR (nombre, apellido, periodo_activo, ganancias) VALUES
    ('Rafael', 'Nadal', '2001-2024', 134946100.00),
    ('Roger', 'Federer', '1998-2022', 130594339.00),
    ('Serena', 'Williams', '1995-2022', 94816730.00),
    ('Novak', 'Djokovic', '2003-Presente', 185000000.00);

INSERT INTO JUGADOR_PAIS (JUGADOR_id_jugador, PAIS_id_pais)
    SELECT j.id_jugador, p.id_pais FROM JUGADOR j, PAIS p
    WHERE (j.apellido = 'Nadal' AND p.nombre = 'España')
       OR (j.apellido = 'Federer' AND p.nombre = 'Suiza')
       OR (j.apellido = 'Williams' AND p.nombre = 'Estados Unidos')
       OR (j.apellido = 'Djokovic' AND p.nombre = 'Serbia');

INSERT INTO ENTRENADOR (nombre, apellido) VALUES
    ('Juan', 'López'), ('Maria', 'García'), ('Carlos', 'Rodríguez');

INSERT INTO ARBITRO (nombre, apellido) VALUES
    ('John', 'Wilkinson'), ('Peter', 'Bell'), ('Marie', 'Dubois');
