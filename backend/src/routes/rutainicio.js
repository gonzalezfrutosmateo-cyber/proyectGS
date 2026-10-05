import express from 'express';
import { rutajugador } from './rutajugador.js';
import { rutaentrenador } from './rutaentrenador.js';
import { rutaarbitro } from './rutaarbitro.js';

const rinicio = express.Router();

rinicio.use(rutajugador);
rinicio.use(rutaentrenador);
rinicio.use(rutaarbitro);

export { rinicio };
