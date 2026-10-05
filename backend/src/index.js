import express from 'express';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';

const puerto = 3000;
const app = express();

//archivos estáticos y middlewares
const directorio = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(directorio, '../../')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rutas

import { rinicio } from './routes/rutainicio.js';
app.use(rinicio);

// Configurar server local
app.listen(puerto, () => {
    console.log(`Servidor iniciando en el puerto ${puerto}`.blue);
});
