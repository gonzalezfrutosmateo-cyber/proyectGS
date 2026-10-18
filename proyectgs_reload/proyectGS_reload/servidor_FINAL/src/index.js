import express from 'express';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';

const puerto = 3000;
const app = express();

//motor de vista
app.set('view engine', 'ejs');

//vistas
const directorio = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(directorio, 'vistas'));
console.log(directorio);

//archivos estáticos (css e imágenes) y middlewares
app.use(express.static(path.join(directorio, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rutas

import { rinicio } from './routes/rutainicio.js';
app.use(rinicio);

// Si falla alguna consulta a la base de datos se muestra la página de error
app.use((error, pet, resp, next) => {
    console.log('Error:'.red, error);
    resp.status(500).render('error', { mensaje: error.message });
});

// Configurar server local
app.listen(puerto, () => {
    console.log(`Servidor iniciando en el puerto ${puerto}`.blue);
});
