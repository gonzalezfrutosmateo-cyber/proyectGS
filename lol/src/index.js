import express from 'express';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';
import { rinicio } from './routes/rutainicio.js';

const puerto = 3000;
const app = express();

const directorio = path.dirname(fileURLToPath(import.meta.url));

// Configurar motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(directorio, 'vistas'));

// Archivos estáticos (css, imágenes, scripts del cliente) y middlewares
app.use(express.static(path.join(directorio, 'vistas')));
app.use(express.static(path.join(directorio, '../../')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rutas
app.use(rinicio);

// Configurar server local
app.listen(puerto, () => {
    console.log(`Servidor iniciando en el puerto ${puerto}`.blue);
});
