import express from 'express';
import { nuevoarbitro } from '../controllers/carbitro.js';

const rutaarbitro = express.Router();

rutaarbitro.get(['/arbitros', '/arbitros.html'], (req, res) => {
    res.render('arbitros');
});

rutaarbitro.post('/nuevoarbitro', nuevoarbitro);

export { rutaarbitro };
