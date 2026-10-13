import express from 'express';
import { rutajugador } from './rutajugador.js';
import { rutaentrenador } from './rutaentrenador.js';
import { rutaarbitro } from './rutaarbitro.js';

const rinicio = express.Router();

// Rutas de vistas principales
rinicio.get(['/', '/index', '/index.html'], (req, res) => {
    res.render('index');
});

rinicio.get(['/torneos', '/torneos.html'], (req, res) => {
    res.render('torneos');
});

rinicio.get(['/partidos', '/partidos.html'], (req, res) => {
    res.render('partidos');
});

rinicio.use(rutajugador);
rinicio.use(rutaentrenador);
rinicio.use(rutaarbitro);

export { rinicio };
