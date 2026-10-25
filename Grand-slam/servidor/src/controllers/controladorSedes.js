import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuSedes = (req, res) => res.render('vistasSedes/menuSedes');

export const listarSedes = async (req, res) => {
    try {
        const consulta = `
            SELECT s.id_sede, s.nombre, p.nombre AS pais
            FROM Sedes s
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
        `;
        const [sedes] = await bd.query(consulta);
        res.render('vistasSedes/verSedes', { sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo (por nombre de la sede o del país)
export const buscarSedes = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let sedes = [];
        if (buscar) {
            const consulta = `
                SELECT s.id_sede, s.nombre, p.nombre AS pais
                FROM Sedes s
                LEFT JOIN Paises p ON s.id_pais = p.id_pais
                WHERE s.nombre LIKE ? OR p.nombre LIKE ?
            `;
            const [resultado] = await bd.query(consulta, [`%${buscar}%`, `%${buscar}%`]);
            sedes = resultado;
        }
        res.render('vistasSedes/buscarSedes', { sedes, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar sedes');
    }
};

export const formularioCrear = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasSedes/crearSedes', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearSede = async (req, res) => {
    try {
        const { nombre, id_pais } = req.body;
        if (!validarNombre(nombre) || !validarId(id_pais)) return res.redirect('/sedes/crear?status=error&tipo=datos');
        await bd.query('INSERT INTO Sedes (nombre, id_pais) VALUES (?, ?)', [nombre.trim(), id_pais]);
        res.redirect('/sedes/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/sedes/crear?status=error');
    }
};

export const seleccionarModificar = async (req, res) => {
    try {
        const [sedes] = await bd.query('SELECT * FROM Sedes');
        res.render('vistasSedes/modificarSedes', { sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [sede] = await bd.query('SELECT * FROM Sedes WHERE id_sede = ?', [req.params.id]);
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasSedes/editarSede', { sede: sede[0], paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarSede = async (req, res) => {
    try {
        const { nombre, id_pais } = req.body;
        if (!validarNombre(nombre) || !validarId(id_pais)) return res.redirect(`/sedes/modificar/${req.params.id}?status=error&tipo=datos`);
        await bd.query('UPDATE Sedes SET nombre = ?, id_pais = ? WHERE id_sede = ?', [nombre.trim(), id_pais, req.params.id]);
        res.redirect('/sedes/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/sedes/modificar/${req.params.id}?status=error`);
    }
};

export const seleccionarEliminar = async (req, res) => {
    try {
        const [sedes] = await bd.query('SELECT * FROM Sedes');
        res.render('vistasSedes/eliminarSedes', { sedes, status: req.query.status, tipo: req.query.tipo });
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

export const eliminarSede = async (req, res) => {
    try {
        await bd.query('DELETE FROM Sedes WHERE id_sede = ?', [req.params.id]);
        res.redirect('/sedes/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/sedes/eliminar?status=error&tipo=relacion');
    }
};

// CONSULTAS
// Lo que pasa en una sede son los partidos de los torneos que se jugaron ahí (Torneos.id_sede).
// Un premio se entrega cuando un jugador gana (es_ganador = 1) un partido de un torneo y fase que tiene premio:
// es el mismo JOIN con Premios que usa el ranking de jugadores (mismo torneo y misma fase).

// CONSULTA: Sedes con más/menos premios entregados
export const verSedesPorPremios = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        // Para cada sede, la subconsulta cuenta los premios que se entregaron en sus torneos
        let consulta = `
            SELECT s.id_sede, s.nombre, p.nombre AS pais,
                   (SELECT COUNT(*)
                    FROM Torneos t
                    JOIN Partidos pa ON t.id_torneo = pa.id_torneo
                    JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
                    JOIN Premios pr ON pa.id_torneo = pr.id_torneo AND pa.fase = pr.fase
                    WHERE t.id_sede = s.id_sede AND pp.es_ganador = 1) AS premios
            FROM Sedes s
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
        `;
        // "mas" ordena de mayor a menor (DESC) y "menos" de menor a mayor (ASC)
        if (orden === 'menos') {
            consulta += ' ORDER BY premios ASC, s.nombre';
        } else {
            consulta += ' ORDER BY premios DESC, s.nombre';
        }
        const [sedes] = await bd.query(consulta);
        res.render('vistasSedes/sedesPremios', { sedes, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar las sedes por premios');
    }
};

// CONSULTA: Sedes con más/menos países participantes
export const verSedesPorPaises = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        // Países distintos de los jugadores que jugaron algún partido en la sede
        let consulta = `
            SELECT s.id_sede, s.nombre, p.nombre AS pais,
                   (SELECT COUNT(DISTINCT jn.id_pais)
                    FROM Torneos t
                    JOIN Partidos pa ON t.id_torneo = pa.id_torneo
                    JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
                    JOIN Jugador_Nacionalidad jn ON pp.id_jugador = jn.id_jugador
                    WHERE t.id_sede = s.id_sede) AS paises
            FROM Sedes s
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
        `;
        if (orden === 'menos') {
            consulta += ' ORDER BY paises ASC, s.nombre';
        } else {
            consulta += ' ORDER BY paises DESC, s.nombre';
        }
        const [sedes] = await bd.query(consulta);
        res.render('vistasSedes/sedesPaises', { sedes, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar las sedes por países');
    }
};

// CONSULTA: Sedes con más/menos jugadores registrados
export const verSedesPorJugadores = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        // Jugadores distintos que jugaron algún partido en la sede
        let consulta = `
            SELECT s.id_sede, s.nombre, p.nombre AS pais,
                   (SELECT COUNT(DISTINCT pp.id_jugador)
                    FROM Torneos t
                    JOIN Partidos pa ON t.id_torneo = pa.id_torneo
                    JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
                    WHERE t.id_sede = s.id_sede) AS jugadores
            FROM Sedes s
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
        `;
        if (orden === 'menos') {
            consulta += ' ORDER BY jugadores ASC, s.nombre';
        } else {
            consulta += ' ORDER BY jugadores DESC, s.nombre';
        }
        const [sedes] = await bd.query(consulta);
        res.render('vistasSedes/sedesJugadores', { sedes, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar las sedes por jugadores');
    }
};

// CONSULTA: Sedes que nunca entregaron un premio
export const verSedesSinPremios = async (req, res) => {
    try {
        // Para cada sede se cuentan los premios entregados y se queda con las que dan 0
        const consulta = `
            SELECT s.id_sede, s.nombre, p.nombre AS pais,
                   (SELECT COUNT(*) FROM Torneos t WHERE t.id_sede = s.id_sede) AS torneos
            FROM Sedes s
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
            WHERE (SELECT COUNT(*)
                   FROM Torneos t
                   JOIN Partidos pa ON t.id_torneo = pa.id_torneo
                   JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
                   JOIN Premios pr ON pa.id_torneo = pr.id_torneo AND pa.fase = pr.fase
                   WHERE t.id_sede = s.id_sede AND pp.es_ganador = 1) = 0
            ORDER BY s.nombre
        `;
        const [sedes] = await bd.query(consulta);
        res.render('vistasSedes/sedesSinPremios', { sedes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar las sedes sin premios');
    }
};

// CONSULTA: Sedes donde un país específico ganó más premios
export const verSedesPorPais = async (req, res) => {
    try {
        const idPais = req.query.id_pais;

        // Traemos los países para el select del filtro
        const [paises] = await bd.query('SELECT * FROM Paises');

        let sedes = [];
        if (idPais) {
            // Cada fila es un premio que ganó un jugador de ese país en un torneo de la sede
            const consulta = `
                SELECT s.nombre, COUNT(*) AS premios
                FROM Sedes s
                JOIN Torneos t ON s.id_sede = t.id_sede
                JOIN Partidos pa ON t.id_torneo = pa.id_torneo
                JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
                JOIN Jugador_Nacionalidad jn ON pp.id_jugador = jn.id_jugador
                JOIN Premios pr ON pa.id_torneo = pr.id_torneo AND pa.fase = pr.fase
                WHERE pp.es_ganador = 1 AND jn.id_pais = ?
                GROUP BY s.id_sede, s.nombre
                ORDER BY premios DESC, s.nombre
            `;
            const [resultado] = await bd.query(consulta, [idPais]);
            sedes = resultado;
        }

        res.render('vistasSedes/sedesPorPais', { paises, sedes, idPais });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar las sedes por país');
    }
};
