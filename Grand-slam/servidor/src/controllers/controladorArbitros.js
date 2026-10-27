import { conectar } from "../database/conexion.js";
const bd = await conectar();

// 1. Menú
export const menuArbitros = (req, res) => {
    res.render('vistasArbitros/menuArbitros');
};

// 2. Ver
export const listarArbitros = async (req, res) => {
    try {
        const [arbitros] = await bd.query('SELECT * FROM Arbitros');
        res.render('vistasArbitros/verArbitros', { arbitros, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo (nombre y apellido juntos)
export const buscarArbitros = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let arbitros = [];
        if (buscar) {
            const patron = `${buscar}%`;
            const [resultado] = await bd.query(
                "SELECT * FROM Arbitros WHERE nombre LIKE ? OR apellido LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ?",
                [patron, patron, patron]
            );
            arbitros = resultado;
        }
        res.render('vistasArbitros/buscarArbitros', { arbitros, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar árbitros');
    }
};

// 3. Crear
export const formularioCrear = (req, res) => {
    res.render('vistasArbitros/crearArbitros', { status: req.query.status, tipo: req.query.tipo });
};

export const crearArbitro = async (req, res) => {
    try {
        const { nombre, apellido } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect('/arbitros/crear?status=error&tipo=datos');
        }
        await bd.query('INSERT INTO Arbitros (nombre, apellido) VALUES (?, ?)', [nombre.trim(), apellido.trim()]);
        res.redirect('/arbitros/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/arbitros/crear?status=error');
    }
};

// 4. Modificar
export const seleccionarModificar = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let consulta = 'SELECT * FROM Arbitros';
        const params = [];
        if (buscar) {
            consulta += " WHERE nombre LIKE ? OR apellido LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ?";
            const patron = `${buscar}%`;
            params.push(patron, patron, patron);
        }
        const [arbitros] = await bd.query(consulta, params);
        res.render('vistasArbitros/modificarArbitros', { arbitros, buscar, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const id = req.params.id;
        const [arbitro] = await bd.query('SELECT * FROM Arbitros WHERE id_arbitro = ?', [id]);
        res.render('vistasArbitros/editarArbitro', { arbitro: arbitro[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarArbitro = async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, apellido } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect(`/arbitros/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        await bd.query('UPDATE Arbitros SET nombre = ?, apellido = ? WHERE id_arbitro = ?', [nombre.trim(), apellido.trim(), id]);
        res.redirect('/arbitros/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/arbitros/modificar/${req.params.id}?status=error`);
    }
};

// 5. Eliminar
export const seleccionarEliminar = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let consulta = 'SELECT * FROM Arbitros';
        const params = [];
        if (buscar) {
            consulta += " WHERE nombre LIKE ? OR apellido LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ?";
            const patron = `${buscar}%`;
            params.push(patron, patron, patron);
        }
        const [arbitros] = await bd.query(consulta, params);
        res.render('vistasArbitros/eliminarArbitros', { arbitros, buscar, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

export const eliminarArbitro = async (req, res) => {
    try {
        const id = req.params.id;
        await bd.query('DELETE FROM Arbitros WHERE id_arbitro = ?', [id]);
        res.redirect('/arbitros/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/arbitros/eliminar?status=error&tipo=relacion');
    }
};

// 6. CONSULTA 2: Árbitros por torneo
export const verArbitrosPorTorneo = async (req, res) => {
    try {
        const idTorneo = req.query.id_torneo;
        
        // Traemos todos los torneos para el select del filtro
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        
        let arbitros = [];
        if (idTorneo) {
            const consulta = `
                SELECT DISTINCT a.nombre, a.apellido 
                FROM Arbitros a
                JOIN Partidos p ON a.id_arbitro = p.id_arbitro
                WHERE p.id_torneo = ?
            `;
            const [resultado] = await bd.query(consulta, [idTorneo]);
            arbitros = resultado;
        }

        res.render('vistasArbitros/arbitrosPorTorneo', { torneos, arbitros, idTorneo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar árbitros');
    }
};

// 7. CONSULTA: Árbitro con mayor cantidad de partidos arbitrados
export const verArbitroMasPartidos = async (req, res) => {
    try {
        // Ranking completo (solo árbitros que arbitraron al menos un partido)
        const [ranking] = await bd.query(`
            SELECT a.id_arbitro, a.nombre, a.apellido, COUNT(p.id_partido) AS total_partidos
            FROM arbitros a
            JOIN partidos p ON a.id_arbitro = p.id_arbitro
            GROUP BY a.id_arbitro, a.nombre, a.apellido
            ORDER BY total_partidos DESC, a.apellido, a.nombre
        `);

        // Si hay empate en el primer puesto, se muestran todos los empatados
        const maximo = ranking.length > 0 ? ranking[0].total_partidos : 0;
        const lideres = ranking.filter(r => r.total_partidos === maximo);

        res.render('vistasArbitros/arbitroMasPartidos', { ranking, lideres, maximo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar el árbitro con más partidos');
    }
};

// 8. CONSULTA: Árbitros de las finales de los torneos
export const verArbitrosFinales = async (req, res) => {
    try {
        const [finales] = await bd.query(`
            SELECT a.nombre AS arbitro_nombre, a.apellido AS arbitro_apellido,
                   t.nombre AS torneo, t.anio, m.nombre AS modalidad, p.resultado
            FROM partidos p
            JOIN arbitros a ON p.id_arbitro = a.id_arbitro
            JOIN torneos t ON p.id_torneo = t.id_torneo
            JOIN modalidades m ON p.id_modalidad = m.id_modalidad
            WHERE p.fase = 'Final'
            ORDER BY t.anio DESC, t.nombre ASC, m.nombre ASC
        `);
        res.render('vistasArbitros/arbitrosFinales', { finales });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar los árbitros de las finales');
    }
};

