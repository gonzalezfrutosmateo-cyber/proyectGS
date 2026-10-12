import express from 'express';
import { nuevojugador } from '../controllers/cjugador.js';

const rutajugador = express.Router();

rutajugador.get(['/jugadores', '/jugadores.html'], (req, res) => {
    res.render('jugadores');
});

rutajugador.post('/nuevojugador', nuevojugador);

export { rutajugador };
