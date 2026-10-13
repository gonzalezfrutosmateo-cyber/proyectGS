import express from 'express';
import { nuevoentrenador } from '../controllers/centrenador.js';

const rutaentrenador = express.Router();

rutaentrenador.get(['/entrenadores', '/entrenadores.html'], (req, res) => {
    res.render('entrenadores');
});

rutaentrenador.post('/nuevoentrenador', nuevoentrenador);

export { rutaentrenador };
