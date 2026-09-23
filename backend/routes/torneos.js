const express = require('express');
const router = express.Router();
const pool = require('../db');
const { envolver } = require('../middleware/envolver');

// Resumen de una edicion: una fila por modalidad con campeon, finalista y
// cuanto dinero repartio el torneo en esa modalidad.
router.get('/:idEdicion/resumen', envolver(async function (req, res) {
    const idEdicion = req.params.idEdicion;

    // Campeon y finalista salen de la Final. El GROUP_CONCAT es para que en
    // dobles aparezcan los dos integrantes de la pareja.
    const [finales] = await pool.query(
        `SELECT p.modalidad,
                GROUP_CONCAT(DISTINCT CASE WHEN pj.rol = 'ganador' THEN CONCAT(j.nombre, ' ', j.apellido) END SEPARATOR ' / ') AS campeon,
                GROUP_CONCAT(DISTINCT CASE WHEN pj.rol = 'perdedor' THEN CONCAT(j.nombre, ' ', j.apellido) END SEPARATOR ' / ') AS finalista
         FROM partido p
         JOIN partido_jugador pj ON pj.partido_id_partido = p.id_partido
         JOIN jugador j ON j.id_jugador = pj.jugador_id_jugador
         WHERE p.edicion_id_edicion = ? AND p.fase = 'Final'
         GROUP BY p.modalidad`,
        [idEdicion]
    );

    // El dinero va en una consulta aparte: si se juntara con la de arriba, el
    // join con partido_jugador multiplica las filas y rompe el SUM.
    const [montos] = await pool.query(
        `SELECT p.modalidad,
                SUM(pr.monto_perdedor_usd) + COALESCE(MAX(pr.monto_campeon_usd), 0) AS dineroRepartido
         FROM partido p
         JOIN premio pr ON pr.edicion_id_edicion = p.edicion_id_edicion
                       AND pr.modalidad = p.modalidad
                       AND pr.fase = p.fase
         WHERE p.edicion_id_edicion = ?
         GROUP BY p.modalidad`,
        [idEdicion]
    );

    const resumen = finales.map(function (fila) {
        const monto = montos.find(function (m) { return m.modalidad === fila.modalidad; });
        return {
            modalidad: fila.modalidad,
            campeon: fila.campeon,
            finalista: fila.finalista,
            dineroRepartido: monto ? monto.dineroRepartido : null,
        };
    });

    res.json(resumen);
}));

module.exports = router;
