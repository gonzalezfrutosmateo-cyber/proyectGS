import express from 'express';
import { entrenadores, altaent, nuevoent, bajaent, eliminarent, modent, actualizarent, mostrarent, consultarent } from '../controllers/centrenador.js';

const rentrenador = express.Router();

rentrenador.get('/entrenadores', entrenadores);
rentrenador.get('/altaent', altaent);
rentrenador.post('/nuevoent', nuevoent);
rentrenador.get('/bajaent', bajaent);
rentrenador.post('/eliminarent', eliminarent);
rentrenador.get('/modent', modent);
rentrenador.post('/actualizarent', actualizarent);
rentrenador.get('/mostrarent', mostrarent);
rentrenador.get('/consultarent', consultarent);

export { rentrenador };
