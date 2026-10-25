import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import dotenv from 'dotenv';

// Importar rutas desde la carpeta 'rutas'
import rutaJugadores from './rutas/rutaJugadores.js';
import rutaPaises from './rutas/rutaPaises.js';
import rutaTorneos from './rutas/rutaTorneos.js';
import rutaArbitros from './rutas/rutaArbitros.js';
import rutaSedes from './rutas/rutaSedes.js';
import rutaModalidades from './rutas/rutaModalidades.js';
import rutaPremios from './rutas/rutaPremios.js';
import rutaEntrenadores from './rutas/rutaEntrenadores.js';
import rutaPartidos from './rutas/rutaPartidos.js';

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vistas')); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Usar las rutas
app.use('/jugadores', rutaJugadores);
app.use('/paises', rutaPaises);
app.use('/torneos', rutaTorneos);
app.use('/arbitros', rutaArbitros);
app.use('/sedes', rutaSedes);
app.use('/modalidades', rutaModalidades);
app.use('/premios', rutaPremios);
app.use('/entrenadores', rutaEntrenadores);
app.use('/partidos', rutaPartidos);

app.get('/', (req, res) => {
    res.render('index', { titulo: 'Torneo Grand Slam' });
});

app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en http://localhost:${app.get('port')}`);
});