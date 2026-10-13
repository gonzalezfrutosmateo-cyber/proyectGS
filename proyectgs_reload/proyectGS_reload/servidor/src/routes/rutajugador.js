import express from 'express';
import { jugadores, altajug, nuevojug, bajajug, eliminarjug, modjug, actualizarjug, mostrarjug, consultarjug } from '../controllers/cjugador.js';

const rjugador = express.Router();

rjugador.get('/jugadores', jugadores);
rjugador.get('/altajug', altajug);
rjugador.post('/nuevojug', nuevojug);
rjugador.get('/bajajug', bajajug);
rjugador.post('/eliminarjug', eliminarjug);
rjugador.get('/modjug', modjug);
rjugador.post('/actualizarjug', actualizarjug);
rjugador.get('/mostrarjug', mostrarjug);
rjugador.get('/consultarjug', consultarjug);

export { rjugador };
