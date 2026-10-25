import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuPaises = (req, res) => res.render('vistasPaises/menuPaises');

export const listarPaises = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasPaises/verPaises', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo
export const buscarPaises = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let paises = [];
        if (buscar) {
            // % = cualquier texto antes o después, así encuentra "Fra" dentro de "Francia"
            const [resultado] = await bd.query('SELECT * FROM Paises WHERE nombre LIKE ?', [`%${buscar}%`]);
            paises = resultado;
        }
        res.render('vistasPaises/buscarPaises', { paises, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar países');
    }
};

export const formularioCrear = (req, res) => res.render('vistasPaises/crearPaises', { status: req.query.status, tipo: req.query.tipo });

export const crearPais = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!validarNombre(nombre)) return res.redirect('/paises/crear?status=error&tipo=datos');
        await bd.query('INSERT INTO Paises (nombre) VALUES (?)', [nombre.trim()]);
        res.redirect('/paises/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/paises/crear?status=error');
    }
};

export const seleccionarModificar = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasPaises/modificarPaises', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [pais] = await bd.query('SELECT * FROM Paises WHERE id_pais = ?', [req.params.id]);
        res.render('vistasPaises/editarPais', { pais: pais[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarPais = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!validarNombre(nombre)) return res.redirect(`/paises/modificar/${req.params.id}?status=error&tipo=datos`);
        await bd.query('UPDATE Paises SET nombre = ? WHERE id_pais = ?', [nombre.trim(), req.params.id]);
        res.redirect('/paises/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/paises/modificar/${req.params.id}?status=error`);
    }
};

export const seleccionarEliminar = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasPaises/eliminarPaises', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

export const eliminarPais = async (req, res) => {
    try {
        await bd.query('DELETE FROM Paises WHERE id_pais = ?', [req.params.id]);
        res.redirect('/paises/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/paises/eliminar?status=error&tipo=relacion');
    }
};

// CONSULTAS
// El país de un jugador sale de Jugador_Nacionalidad.
// Un jugador "gana un premio" cuando gana (es_ganador = 1) un partido de un torneo y fase que tiene premio:
// es el mismo JOIN con Premios que usa el ranking de jugadores (mismo torneo y misma fase).

// CONSULTA: Países con más/menos jugadores
export const verPaisesPorJugadores = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        // Para cada país, la subconsulta cuenta cuántos jugadores tienen esa nacionalidad
        let consulta = `
            SELECT pa.id_pais, pa.nombre,
                   (SELECT COUNT(*) FROM Jugador_Nacionalidad jn WHERE jn.id_pais = pa.id_pais) AS jugadores
            FROM Paises pa
        `;
        // "mas" ordena de mayor a menor (DESC) y "menos" de menor a mayor (ASC)
        if (orden === 'menos') {
            consulta += ' ORDER BY jugadores ASC, pa.nombre';
        } else {
            consulta += ' ORDER BY jugadores DESC, pa.nombre';
        }
        const [paises] = await bd.query(consulta);
        res.render('vistasPaises/paisesJugadores', { paises, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los países por jugadores');
    }
};

// CONSULTA: Países con más/menos ganadores de premios
export const verPaisesPorGanadores = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        // DISTINCT para que un jugador que ganó varios premios se cuente una sola vez
        let consulta = `
            SELECT pa.id_pais, pa.nombre,
                   (SELECT COUNT(DISTINCT pp.id_jugador)
                    FROM Jugador_Nacionalidad jn
                    JOIN Participaciones_Partidos pp ON jn.id_jugador = pp.id_jugador
                    JOIN Partidos p ON pp.id_partido = p.id_partido
                    JOIN Premios pr ON p.id_torneo = pr.id_torneo AND p.fase = pr.fase
                    WHERE jn.id_pais = pa.id_pais AND pp.es_ganador = 1) AS ganadores
            FROM Paises pa
        `;
        if (orden === 'menos') {
            consulta += ' ORDER BY ganadores ASC, pa.nombre';
        } else {
            consulta += ' ORDER BY ganadores DESC, pa.nombre';
        }
        const [paises] = await bd.query(consulta);
        res.render('vistasPaises/paisesGanadores', { paises, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los países por ganadores de premios');
    }
};

// CONSULTA: Países con más/menos sedes albergadas
export const verPaisesPorSedes = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        let consulta = `
            SELECT pa.id_pais, pa.nombre,
                   (SELECT COUNT(*) FROM Sedes s WHERE s.id_pais = pa.id_pais) AS sedes
            FROM Paises pa
        `;
        if (orden === 'menos') {
            consulta += ' ORDER BY sedes ASC, pa.nombre';
        } else {
            consulta += ' ORDER BY sedes DESC, pa.nombre';
        }
        const [paises] = await bd.query(consulta);
        res.render('vistasPaises/paisesSedes', { paises, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los países por sedes');
    }
};

// CONSULTA: Países sin ningún premio ganado
export const verPaisesSinPremios = async (req, res) => {
    try {
        // Para cada país se cuentan los premios que ganaron sus jugadores y se queda con los que dan 0
        const consulta = `
            SELECT pa.id_pais, pa.nombre,
                   (SELECT COUNT(*) FROM Jugador_Nacionalidad jn WHERE jn.id_pais = pa.id_pais) AS jugadores
            FROM Paises pa
            WHERE (SELECT COUNT(*)
                   FROM Jugador_Nacionalidad jn
                   JOIN Participaciones_Partidos pp ON jn.id_jugador = pp.id_jugador
                   JOIN Partidos p ON pp.id_partido = p.id_partido
                   JOIN Premios pr ON p.id_torneo = pr.id_torneo AND p.fase = pr.fase
                   WHERE jn.id_pais = pa.id_pais AND pp.es_ganador = 1) = 0
            ORDER BY pa.nombre
        `;
        const [paises] = await bd.query(consulta);
        res.render('vistasPaises/paisesSinPremios', { paises });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los países sin premios');
    }
};

// CONSULTA: Países con más premios ganados en una sede específica
export const verPaisesPorSede = async (req, res) => {
    try {
        const idSede = req.query.id_sede;

        // Traemos las sedes para el select del filtro
        const [sedes] = await bd.query('SELECT * FROM Sedes');

        let paises = [];
        if (idSede) {
            // Cada fila es un premio que ganó un jugador del país en un torneo de esa sede
            const consulta = `
                SELECT pa.nombre, COUNT(*) AS premios
                FROM Paises pa
                JOIN Jugador_Nacionalidad jn ON pa.id_pais = jn.id_pais
                JOIN Participaciones_Partidos pp ON jn.id_jugador = pp.id_jugador
                JOIN Partidos p ON pp.id_partido = p.id_partido
                JOIN Torneos t ON p.id_torneo = t.id_torneo
                JOIN Premios pr ON p.id_torneo = pr.id_torneo AND p.fase = pr.fase
                WHERE pp.es_ganador = 1 AND t.id_sede = ?
                GROUP BY pa.id_pais, pa.nombre
                ORDER BY premios DESC, pa.nombre
            `;
            const [resultado] = await bd.query(consulta, [idSede]);
            paises = resultado;
        }

        res.render('vistasPaises/paisesPorSede', { sedes, paises, idSede });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los premios por sede');
    }
};
