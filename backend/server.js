require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const pool = require('./db');

const { envolver } = require('./middleware/envolver');
const authRoutes = require('./routes/auth');
const jugadoresRoutes = require('./routes/jugadores');
const entrenadoresRoutes = require('./routes/entrenadores');
const arbitrosRoutes = require('./routes/arbitros');
const partidosRoutes = require('./routes/partidos');
const torneosRoutes = require('./routes/torneos');

const app = express();

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use('/api/auth', authRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/entrenadores', entrenadoresRoutes);
app.use('/api/arbitros', arbitrosRoutes);
app.use('/api/partidos', partidosRoutes);
app.use('/api/torneos', torneosRoutes);

app.get('/api/ediciones', envolver(async function (req, res) {
    const [rows] = await pool.query(
        `SELECT e.id_edicion AS id, e.anio, e.superficie, t.nombre AS torneo
         FROM edicion e JOIN torneo t ON t.id_torneo = e.torneo_id_torneo
         ORDER BY t.nombre, e.anio`
    );
    res.json(rows);
}));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async function () {
    console.log('Servidor corriendo en http://localhost:' + PORT);
    try {
        await pool.query('SELECT 1');
        console.log('Conectado a la base ' + process.env.DB_NAME);
    } catch (error) {
        console.error('NO se pudo conectar a MySQL: ' + error.message);
        console.error('Revisá DB_USER y DB_PASSWORD en backend/.env');
    }
});
