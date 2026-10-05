import express from 'express';
import { ventas, altaventa, bajaventa, modventa, mostrarventa, consultarventa } from '../controllers/cventas.js';

const rventas = express.Router();

rventas.get('/ventas', ventas);
rventas.get('/venta', ventas);
rventas.get('/altaventa', altaventa);
rventas.get('/bajaventa', bajaventa);
rventas.get('/modventa', modventa);
rventas.get('/mostrarventa', mostrarventa);
rventas.get('/consultarventa', consultarventa);

export { rventas };
