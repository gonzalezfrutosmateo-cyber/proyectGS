import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuJugadores = (req, res) => {
    res.render('vistasJugadores/menuJugadores');
};

export const formularioCrear = (req, res) => {
    res.render('vistasJugadores/crearJugadores', { status: req.query.status, tipo: req.query.tipo });
};

export const crearJugador = async (req, res) => {
    try {
        const { nombre, apellido } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect('/jugadores/crear?status=error&tipo=datos');
        }
        await bd.query('INSERT INTO Jugadores (nombre, apellido) VALUES (?, ?)', [nombre.trim(), apellido.trim()]);
        res.redirect('/jugadores/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/jugadores/crear?status=error');
    }
};

export const verJugadores = async (req, res) => {
    try {
        res.render('vistasJugadores/verJugadores', { status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const verJugadoresJSON = async (req, res) => {
    try {
        const [jugadores] = await bd.query('SELECT id_jugador, nombre, apellido FROM Jugadores');
        res.json(jugadores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al cargar los jugadores' });
    }
};

// Buscar: solo muestra resultados después de escribir algo
export const buscarJugadores = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let jugadores = [];
        if (buscar) {
            // Se busca en nombre y apellido juntos, así funciona escribir "juan rod"
            const [resultado] = await bd.query(
                "SELECT * FROM Jugadores WHERE CONCAT(nombre, ' ', apellido) LIKE ?",
                [`%${buscar}%`]
            );
            jugadores = resultado;
        }
        res.render('vistasJugadores/buscarJugadores', { jugadores, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar jugadores');
    }
};

export const listarParaModificar = async (req, res) => {
    try {
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');
        res.render('vistasJugadores/modificarJugadores', { jugadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [resultado] = await bd.query('SELECT * FROM Jugadores WHERE id_jugador = ?', [req.params.id]);
        res.render('vistasJugadores/editarJugador', { jugador: resultado[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const modificarJugador = async (req, res) => {
    try {
        const { nombre, apellido } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect(`/jugadores/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        await bd.query('UPDATE Jugadores SET nombre = ?, apellido = ? WHERE id_jugador = ?', [nombre.trim(), apellido.trim(), req.params.id]);
        res.redirect('/jugadores/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/jugadores/modificar/${req.params.id}?status=error`);
    }
};

export const listarParaEliminar = async (req, res) => {
    try {
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');
        res.render('vistasJugadores/eliminarJugadores', { jugadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

export const eliminarJugador = async (req, res) => {
    try {
        const [partidos] = await bd.query(`
            SELECT COUNT(*) AS cantidad
            FROM Participaciones_Partidos pp
            WHERE pp.id_jugador = ?
        `, [req.params.id]);
        if (partidos[0].cantidad > 0) {
            return res.redirect('/jugadores/eliminar?status=error&tipo=relacion');
        }
        await bd.query('DELETE FROM Jugadores WHERE id_jugador = ?', [req.params.id]);
        res.redirect('/jugadores/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/jugadores/eliminar?status=error&tipo=relacion');
    }
};

export const verGanancias = async (req, res) => {
    try {
        const idJugador = req.params.id;
        const consulta = `
            SELECT j.nombre, j.apellido,
                   SUM(CASE WHEN pp.es_ganador = 1 THEN p.monto_ganador ELSE p.monto_perdedor END) as total_ganado
            FROM Jugadores j
            JOIN Participaciones_Partidos pp ON j.id_jugador = pp.id_jugador
            JOIN Partidos part ON pp.id_partido = part.id_partido
            JOIN Premios p ON part.id_torneo = p.id_torneo AND part.fase = p.fase
            WHERE j.id_jugador = ?
            GROUP BY j.id_jugador, j.nombre, j.apellido
        `;
        const [resultados] = await bd.query(consulta, [idJugador]);
        const ganancias = resultados.length > 0 ? resultados[0].total_ganado : 0;
        res.render('vistasJugadores/gananciasJugador', { 
            nombre: req.query.nombre || 'Jugador', 
            ganancias: ganancias 
        });
    } catch (error) { res.status(500).send('Error'); }
};