const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireRole } = require('../middleware/auth');
const { envolver } = require('../middleware/envolver');

router.get('/', envolver(async function (req, res) {
    const [rows] = await pool.query(
        'SELECT id_entrenador AS id, nombre, apellido FROM entrenador WHERE activo = 1 ORDER BY apellido'
    );
    res.json(rows);
}));

router.post('/', requireRole('admin'), envolver(async function (req, res) {
    const { nombre, apellido } = req.body;
    if (!nombre || !apellido) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    const [resultado] = await pool.query(
        'INSERT INTO entrenador (nombre, apellido) VALUES (?, ?)',
        [nombre, apellido]
    );
    res.status(201).json({ id: resultado.insertId });
}));

router.put('/:id', requireRole('admin'), envolver(async function (req, res) {
    const { nombre, apellido } = req.body;
    if (!nombre || !apellido) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    await pool.query(
        'UPDATE entrenador SET nombre = ?, apellido = ? WHERE id_entrenador = ?',
        [nombre, apellido, req.params.id]
    );
    res.json({ ok: true });
}));

router.delete('/:id', requireRole('admin'), envolver(async function (req, res) {
    await pool.query('UPDATE entrenador SET activo = 0 WHERE id_entrenador = ?', [req.params.id]);
    res.json({ ok: true });
}));

module.exports = router;
