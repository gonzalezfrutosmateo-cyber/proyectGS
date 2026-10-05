import express from 'express';
import { nuevoarbitro } from '../controllers/carbitro.js';

const rutaarbitro = express.Router();

rutaarbitro.post('/nuevoarbitro', nuevoarbitro);

export { rutaarbitro };
