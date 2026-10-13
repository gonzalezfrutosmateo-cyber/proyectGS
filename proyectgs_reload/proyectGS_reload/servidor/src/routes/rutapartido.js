import express from 'express';
import { partidos, altapar, nuevopar, bajapar, eliminarpar, modpar, actualizarpar, mostrarpar, consultarpar } from '../controllers/cpartido.js';

const rpartido = express.Router();

rpartido.get('/partidos', partidos);
rpartido.get('/altapar', altapar);
rpartido.post('/nuevopar', nuevopar);
rpartido.get('/bajapar', bajapar);
rpartido.post('/eliminarpar', eliminarpar);
rpartido.get('/modpar', modpar);
rpartido.post('/actualizarpar', actualizarpar);
rpartido.get('/mostrarpar', mostrarpar);
rpartido.get('/consultarpar', consultarpar);

export { rpartido };
