import express from 'express';
import { rjugador } from './rutajugador.js';
import { rentrenador } from './rutaentrenador.js';
import { rarbitro } from './rutaarbitro.js';
import { rtorneo } from './rutatorneo.js';
import { rpartido } from './rutapartido.js';


const rinicio = express.Router();

rinicio.get('/', (pet, resp) => {
    resp.render('index');
})

rinicio.use(rjugador);
rinicio.use(rentrenador);
rinicio.use(rarbitro);
rinicio.use(rtorneo);
rinicio.use(rpartido);

export { rinicio };
