import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuJugadores = (req, res) => {
    res.render('vistasJugadores/menuJugadores');
};

export const formularioCrear = async (req, res) => {
    try {
        // Traemos los países para el select
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasJugadores/crearJugadores', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearJugador = async (req, res) => {
    try {
        const { nombre, apellido, id_pais } = req.body;
        // El país es opcional (vacío = apátrida), pero si viene tiene que ser un id válido
        if (!validarNombre(nombre) || !validarNombre(apellido) || (id_pais && !validarId(id_pais))) {
            return res.redirect('/jugadores/crear?status=error&tipo=datos');
        }
        // Se revisa antes de crear el jugador, así no queda un jugador cargado sin su país
        if (id_pais) {
            const [paisExiste] = await bd.query('SELECT id_pais FROM Paises WHERE id_pais = ?', [id_pais]);
            if (paisExiste.length === 0) {
                return res.redirect('/jugadores/crear?status=error&tipo=datos');
            }
        }
        const [resJugador] = await bd.query('INSERT INTO Jugadores (nombre, apellido) VALUES (?, ?)', [nombre.trim(), apellido.trim()]);

        // Se usa el id del jugador recién creado para guardar su nacionalidad
        if (id_pais) {
            await bd.query('INSERT INTO Jugador_Nacionalidad (id_jugador, id_pais) VALUES (?, ?)', [resJugador.insertId, id_pais]);
        }
        res.redirect('/jugadores/crear?status=success');
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

export const verRankingJugadores = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        const consulta = `
            SELECT j.id_jugador, j.nombre, j.apellido,
                   COALESCE((
                       SELECT SUM(CASE WHEN pp.es_ganador = 1 THEN pr.monto_ganador ELSE pr.monto_perdedor END)
                       FROM Participaciones_Partidos pp
                       JOIN Partidos p ON pp.id_partido = p.id_partido
                       JOIN Premios pr ON p.id_torneo = pr.id_torneo AND p.fase = pr.fase
                       WHERE pp.id_jugador = j.id_jugador
                   ), 0) AS premios_totales,
                   (
                       SELECT COUNT(DISTINCT p.id_torneo)
                       FROM Participaciones_Partidos pp
                       JOIN Partidos p ON pp.id_partido = p.id_partido
                       WHERE pp.id_jugador = j.id_jugador
                         AND pp.es_ganador = 1
                         AND LOWER(TRIM(p.fase)) = 'final'
                   ) AS torneos_ganados
            FROM Jugadores j
            WHERE ? = '' OR CONCAT(j.nombre, ' ', j.apellido) LIKE ?
            ORDER BY torneos_ganados DESC, premios_totales DESC, j.apellido, j.nombre
        `;
        const [jugadores] = await bd.query(consulta, [buscar, `%${buscar}%`]);
        res.render('vistasJugadores/rankingJugadores', { jugadores, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar el ranking de jugadores');
    }
};

export const verHistorialJugador = async (req, res) => {
    try {
        const idJugador = req.query.id_jugador || '';
        const anio = req.query.anio || '';
        const [jugadores] = await bd.query('SELECT id_jugador, nombre, apellido FROM Jugadores ORDER BY apellido, nombre');
        let historial = [];

        if (anio && (!/^\d{4}$/.test(anio) || Number(anio) < 1877 || Number(anio) > new Date().getFullYear())) {
            return res.render('vistasJugadores/historialJugador', {
                jugadores, historial, idJugador, anio, status: 'error', tipo: 'anio'
            });
        }
        if ('id_jugador' in req.query && !idJugador) {
            return res.render('vistasJugadores/historialJugador', {
                jugadores, historial, idJugador: '', anio, status: 'error', tipo: 'jugador'
            });
        }
        if (idJugador && !/^[1-9]\d*$/.test(idJugador)) {
            return res.render('vistasJugadores/historialJugador', {
                jugadores, historial, idJugador: '', anio, status: 'error', tipo: 'jugador'
            });
        }

        if (idJugador) {
            const [jugadorExiste] = await bd.query('SELECT id_jugador FROM Jugadores WHERE id_jugador = ?', [idJugador]);
            if (jugadorExiste.length === 0) {
                return res.render('vistasJugadores/historialJugador', {
                    jugadores, historial, idJugador: '', anio, status: 'error', tipo: 'jugador'
                });
            }
            const consulta = `
                SELECT t.nombre AS torneo, t.anio, m.nombre AS modalidad,
                       COUNT(DISTINCT p.id_partido) AS partidos_jugados,
                       COUNT(DISTINCT CASE WHEN pp.es_ganador = 1 THEN p.id_partido END) AS partidos_ganados,
                       COALESCE(SUM(CASE WHEN pp.es_ganador = 1 THEN pr.monto_ganador ELSE pr.monto_perdedor END), 0) AS premios
                FROM Participaciones_Partidos pp
                JOIN Partidos p ON pp.id_partido = p.id_partido
                JOIN Torneos t ON p.id_torneo = t.id_torneo
                JOIN Modalidades m ON p.id_modalidad = m.id_modalidad
                LEFT JOIN Premios pr ON p.id_torneo = pr.id_torneo AND p.fase = pr.fase
                WHERE pp.id_jugador = ? AND (? = '' OR t.anio = ?)
                GROUP BY t.id_torneo, m.id_modalidad, t.nombre, t.anio, m.nombre
                ORDER BY t.anio DESC, t.nombre, m.nombre
            `;
            const [resultado] = await bd.query(consulta, [idJugador, anio, anio]);
            historial = resultado;
        }

        res.render('vistasJugadores/historialJugador', { jugadores, historial, idJugador, anio });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar el historial del jugador');
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
        res.redirect('/jugadores/modificar?status=success');
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

function validarId(valor) {
    return /^[1-9]\d*$/.test(String(valor || ''));
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
            ganancias: ganancias,
            sinPremios: resultados.length === 0
        });
    } catch (error) { res.status(500).send('Error'); }
};
