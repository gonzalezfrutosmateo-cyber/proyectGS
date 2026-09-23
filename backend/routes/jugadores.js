const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireRole } = require('../middleware/auth');
const { envolver } = require('../middleware/envolver');

router.get('/', envolver(async function (req, res) {
    const [rows] = await pool.query(
        `SELECT j.id_jugador AS id, j.nombre, j.apellido, j.sexo, j.periodo_activo AS periodoActivo,
                j.ganancias, GROUP_CONCAT(p.nombre SEPARATOR ', ') AS nacionalidad
         FROM jugador j
         LEFT JOIN jugador_pais jp ON jp.jugador_id_jugador = j.id_jugador
         LEFT JOIN pais p ON p.id_pais = jp.pais_id_pais
         WHERE j.activo = 1
         GROUP BY j.id_jugador
         ORDER BY j.apellido`
    );
    res.json(rows);
}));

async function obtenerOCrearPais(connection, nombrePais) {
    const [existentes] = await connection.query('SELECT id_pais FROM pais WHERE nombre = ?', [nombrePais]);
    if (existentes[0]) {
        return existentes[0].id_pais;
    }
    const [resultado] = await connection.query('INSERT INTO pais (nombre) VALUES (?)', [nombrePais]);
    return resultado.insertId;
}

router.post('/', requireRole('admin'), envolver(async function (req, res) {
    const { nombre, apellido, sexo, nacionalidad, periodoActivo, ganancias } = req.body;
    if (!nombre || !apellido || !sexo || !nacionalidad) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [resultado] = await connection.query(
            'INSERT INTO jugador (nombre, apellido, sexo, periodo_activo, ganancias) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, sexo, periodoActivo || null, ganancias || null]
        );
        const idPais = await obtenerOCrearPais(connection, nacionalidad);
        await connection.query(
            'INSERT INTO jugador_pais (jugador_id_jugador, pais_id_pais) VALUES (?, ?)',
            [resultado.insertId, idPais]
        );
        await connection.commit();
        res.status(201).json({ id: resultado.insertId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'No se pudo guardar el jugador' });
    } finally {
        connection.release();
    }
}));

router.put('/:id', requireRole('admin'), envolver(async function (req, res) {
    const { nombre, apellido, sexo, nacionalidad, periodoActivo, ganancias } = req.body;
    if (!nombre || !apellido || !sexo || !nacionalidad) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE jugador SET nombre = ?, apellido = ?, sexo = ?, periodo_activo = ?, ganancias = ? WHERE id_jugador = ?',
            [nombre, apellido, sexo, periodoActivo || null, ganancias || null, req.params.id]
        );
        const idPais = await obtenerOCrearPais(connection, nacionalidad);
        await connection.query('DELETE FROM jugador_pais WHERE jugador_id_jugador = ?', [req.params.id]);
        await connection.query(
            'INSERT INTO jugador_pais (jugador_id_jugador, pais_id_pais) VALUES (?, ?)',
            [req.params.id, idPais]
        );
        await connection.commit();
        res.json({ ok: true });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'No se pudo modificar el jugador' });
    } finally {
        connection.release();
    }
}));

router.delete('/:id', requireRole('admin'), envolver(async function (req, res) {
    await pool.query('UPDATE jugador SET activo = 0 WHERE id_jugador = ?', [req.params.id]);
    res.json({ ok: true });
}));

module.exports = router;
