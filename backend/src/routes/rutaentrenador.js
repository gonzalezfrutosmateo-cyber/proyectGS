import express from 'express';
import { nuevoentrenador } from '../controllers/centrenador.js';

const rutaentrenador = express.Router();

rutaentrenador.post('/nuevoentrenador', nuevoentrenador);

export { rutaentrenador };
