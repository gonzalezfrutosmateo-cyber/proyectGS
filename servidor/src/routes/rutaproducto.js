import express from 'express';
import { productos, altaprod, bajaprod, modprod, mostrarprod, consultarprod } from '../controllers/cproducto.js';

const rproducto = express.Router();

rproducto.get('/productos', productos);
rproducto.get('/producto', productos);
rproducto.get('/altaprod', altaprod);
rproducto.get('/bajaprod', bajaprod);
rproducto.get('/modprod', modprod);
rproducto.get('/mostrarprod', mostrarprod);
rproducto.get('/consultarprod', consultarprod);

export { rproducto };
