import express from 'express';
import { rutacliente } from './rutacliente.js';
import { rproducto } from './rutaproducto.js';
import { rventas } from './rutaventas.js';


const rinicio = express.Router();

rinicio.get('/', (pet, resp) => {
    resp.render('index');
})

rinicio.use(rutacliente);
rinicio.use(rproducto);
rinicio.use(rventas);

export { rinicio };