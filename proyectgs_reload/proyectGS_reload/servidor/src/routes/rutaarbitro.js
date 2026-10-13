import express from 'express';
import { arbitros, altaarb, nuevoarb, bajaarb, eliminararb, modarb, actualizararb, mostrararb, consultararb } from '../controllers/carbitro.js';

const rarbitro = express.Router();

rarbitro.get('/arbitros', arbitros);
rarbitro.get('/altaarb', altaarb);
rarbitro.post('/nuevoarb', nuevoarb);
rarbitro.get('/bajaarb', bajaarb);
rarbitro.post('/eliminararb', eliminararb);
rarbitro.get('/modarb', modarb);
rarbitro.post('/actualizararb', actualizararb);
rarbitro.get('/mostrararb', mostrararb);
rarbitro.get('/consultararb', consultararb);

export { rarbitro };
