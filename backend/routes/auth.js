const express = require('express');
const router = express.Router();
const pool = require('../db');
const { envolver } = require('../middleware/envolver');

router.post('/login', envolver(async function (req, res) {
    const { nombreUsuario, passwordHash } = req.body;
    if (!nombreUsuario || !passwordHash) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    const [rows] = await pool.query(
        'SELECT id_usuario, nombre_usuario, password_hash, rol FROM usuario WHERE nombre_usuario = ?',
        [nombreUsuario]
    );
    const usuario = rows[0];

    if (!usuario || usuario.password_hash !== passwordHash) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    req.session.usuario = {
        idUsuario: usuario.id_usuario,
        nombreUsuario: usuario.nombre_usuario,
        rol: usuario.rol,
    };
    res.json(req.session.usuario);
}));

router.post('/logout', function (req, res) {
    req.session.destroy(function () {
        res.json({ ok: true });
    });
});

router.get('/me', function (req, res) {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'No hay sesión iniciada' });
    }
    res.json(req.session.usuario);
});

module.exports = router;
