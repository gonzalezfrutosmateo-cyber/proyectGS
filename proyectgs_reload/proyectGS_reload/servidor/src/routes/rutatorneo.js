import express from 'express';
import { torneos, altator, nuevotor, bajator, eliminartor, modtor, actualizartor, mostrartor, consultartor } from '../controllers/ctorneo.js';

const rtorneo = express.Router();

rtorneo.get('/torneos', torneos);
rtorneo.get('/altator', altator);
rtorneo.post('/nuevotor', nuevotor);
rtorneo.get('/bajator', bajator);
rtorneo.post('/eliminartor', eliminartor);
rtorneo.get('/modtor', modtor);
rtorneo.post('/actualizartor', actualizartor);
rtorneo.get('/mostrartor', mostrartor);
rtorneo.get('/consultartor', consultartor);

export { rtorneo };
