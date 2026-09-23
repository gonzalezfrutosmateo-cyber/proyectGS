const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireRole } = require('../middleware/auth');
const { envolver } = require('../middleware/envolver');

function cardinalidadValida(modalidad, ganadores, perdedores) {
    const esperados = modalidad.startsWith('dobles') ? 2 : 1;
    return ganadores.length === esperados && perdedores.length === esperados;
}

router.get('/', envolver(async function (req, res) {
    const [partidos] = await pool.query(
        `SELECT p.id_partido AS id, p.fecha, p.fase, p.modalidad, p.estado,
                t.nombre AS torneo, e.anio,
                CONCAT(a.nombre, ' ', a.apellido) AS arbitro,
                GROUP_CONCAT(DISTINCT CASE WHEN pj.rol = 'ganador' THEN CONCAT(j.nombre, ' ', j.apellido) END SEPARATOR ' / ') AS ganadores,
                GROUP_CONCAT(DISTINCT CASE WHEN pj.rol = 'perdedor' THEN CONCAT(j.nombre, ' ', j.apellido) END SEPARATOR ' / ') AS perdedores
         FROM partido p
         JOIN edicion e ON e.id_edicion = p.edicion_id_edicion
         JOIN torneo t ON t.id_torneo = e.torneo_id_torneo
         JOIN arbitro a ON a.id_arbitro = p.arbitro_id_arbitro
         LEFT JOIN partido_jugador pj ON pj.partido_id_partido = p.id_partido
         LEFT JOIN jugador j ON j.id_jugador = pj.jugador_id_jugador
         GROUP BY p.id_partido
         ORDER BY e.anio DESC, p.fecha DESC`
    );

    const [sets] = await pool.query(
        `SELECT partido_id_partido AS partidoId, nro_set AS nroSet,
                games_ganador_partido AS gamesGanador, games_perdedor_partido AS gamesPerdedor,
                tiebreak_perdedor AS tiebreakPerdedor
         FROM resultado_set
         ORDER BY partido_id_partido, nro_set`
    );

    partidos.forEach(function (partido) {
        partido.sets = sets.filter(function (set) { return set.partidoId === partido.id; });
    });

    res.json(partidos);
}));

router.post('/', requireRole('arbitro', 'admin'), envolver(async function (req, res) {
    const { edicionId, arbitroId, fecha, fase, modalidad, estado, ganadores, perdedores, sets } = req.body;

    if (!edicionId || !arbitroId || !fecha || !fase || !modalidad || !Array.isArray(ganadores) || !Array.isArray(perdedores)) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    if (!cardinalidadValida(modalidad, ganadores, perdedores)) {
        return res.status(400).json({ error: 'Cantidad de ganadores/perdedores inválida para esta modalidad' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [resultado] = await connection.query(
            'INSERT INTO partido (fecha, fase, modalidad, estado, edicion_id_edicion, arbitro_id_arbitro) VALUES (?, ?, ?, ?, ?, ?)',
            [fecha, fase, modalidad, estado || 'jugado', edicionId, arbitroId]
        );
        const idPartido = resultado.insertId;

        for (const idJugador of ganadores) {
            await connection.query(
                'INSERT INTO partido_jugador (rol, partido_id_partido, jugador_id_jugador) VALUES (?, ?, ?)',
                ['ganador', idPartido, idJugador]
            );
        }
        for (const idJugador of perdedores) {
            await connection.query(
                'INSERT INTO partido_jugador (rol, partido_id_partido, jugador_id_jugador) VALUES (?, ?, ?)',
                ['perdedor', idPartido, idJugador]
            );
        }
        for (let i = 0; i < (sets || []).length; i++) {
            const set = sets[i];
            await connection.query(
                'INSERT INTO resultado_set (partido_id_partido, nro_set, games_ganador_partido, games_perdedor_partido, tiebreak_perdedor) VALUES (?, ?, ?, ?, ?)',
                [idPartido, i + 1, set.gamesGanador, set.gamesPerdedor, set.tiebreakPerdedor || null]
            );
        }

        await connection.commit();
        res.status(201).json({ id: idPartido });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'No se pudo guardar el partido' });
    } finally {
        connection.release();
    }
}));

router.put('/:id', requireRole('arbitro', 'admin'), envolver(async function (req, res) {
    const { edicionId, arbitroId, fecha, fase, modalidad, estado, ganadores, perdedores, sets } = req.body;

    if (!edicionId || !arbitroId || !fecha || !fase || !modalidad || !Array.isArray(ganadores) || !Array.isArray(perdedores)) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    if (!cardinalidadValida(modalidad, ganadores, perdedores)) {
        return res.status(400).json({ error: 'Cantidad de ganadores/perdedores inválida para esta modalidad' });
    }

    const idPartido = req.params.id;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'UPDATE partido SET fecha = ?, fase = ?, modalidad = ?, estado = ?, edicion_id_edicion = ?, arbitro_id_arbitro = ? WHERE id_partido = ?',
            [fecha, fase, modalidad, estado || 'jugado', edicionId, arbitroId, idPartido]
        );
        await connection.query('DELETE FROM partido_jugador WHERE partido_id_partido = ?', [idPartido]);
        await connection.query('DELETE FROM resultado_set WHERE partido_id_partido = ?', [idPartido]);

        for (const idJugador of ganadores) {
            await connection.query(
                'INSERT INTO partido_jugador (rol, partido_id_partido, jugador_id_jugador) VALUES (?, ?, ?)',
                ['ganador', idPartido, idJugador]
            );
        }
        for (const idJugador of perdedores) {
            await connection.query(
                'INSERT INTO partido_jugador (rol, partido_id_partido, jugador_id_jugador) VALUES (?, ?, ?)',
                ['perdedor', idPartido, idJugador]
            );
        }
        for (let i = 0; i < (sets || []).length; i++) {
            const set = sets[i];
            await connection.query(
                'INSERT INTO resultado_set (partido_id_partido, nro_set, games_ganador_partido, games_perdedor_partido, tiebreak_perdedor) VALUES (?, ?, ?, ?, ?)',
                [idPartido, i + 1, set.gamesGanador, set.gamesPerdedor, set.tiebreakPerdedor || null]
            );
        }

        await connection.commit();
        res.json({ ok: true });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'No se pudo modificar el partido' });
    } finally {
        connection.release();
    }
}));

router.delete('/:id', requireRole('admin'), envolver(async function (req, res) {
    await pool.query('DELETE FROM partido WHERE id_partido = ?', [req.params.id]);
    res.json({ ok: true });
}));

module.exports = router;
