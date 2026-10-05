import express from 'express';
import { nuevojugador } from '../controllers/cjugador.js';

const rutajugador = express.Router();

rutajugador.post('/nuevojugador', nuevojugador);

export { rutajugador };
