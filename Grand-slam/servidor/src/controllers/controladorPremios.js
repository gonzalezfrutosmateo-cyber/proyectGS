import { conectar } from "../database/conexion.js";
const bd = await conectar();

// 1. Menú
export const menuPremios = (req, res) => {
    res.render('vistasPremios/menuPremios');
};

// 2. Ver (Hacemos un JOIN para mostrar el nombre del torneo, no solo el ID)
export const listarPremios = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo_nombre, t.anio AS torneo_anio
            FROM Premios p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
        `;
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/verPremios', { premios, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo (por nombre del torneo o por fase)
export const buscarPremios = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let premios = [];
        if (buscar) {
            const consulta = `
                SELECT p.*, t.nombre AS torneo_nombre, t.anio AS torneo_anio
                FROM Premios p
                JOIN Torneos t ON p.id_torneo = t.id_torneo
                WHERE t.nombre LIKE ? OR p.fase LIKE ?
            `;
            const [resultado] = await bd.query(consulta, [`%${buscar}%`, `%${buscar}%`]);
            premios = resultado;
        }
        res.render('vistasPremios/buscarPremios', { premios, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar premios');
    }
};

// 3. Crear
export const formularioCrear = async (req, res) => {
    try {
        // Traemos los torneos para el select
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        res.render('vistasPremios/crearPremios', { torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearPremio = async (req, res) => {
    try {
        const { id_torneo, fase, monto_ganador, monto_perdedor } = req.body;
        if (!validarId(id_torneo) || !validarFase(fase) || !validarMonto(monto_ganador) || !validarMonto(monto_perdedor)) {
            return res.redirect('/premios/crear?status=error&tipo=datos');
        }
        const consulta = 'INSERT INTO Premios (id_torneo, fase, monto_ganador, monto_perdedor) VALUES (?, ?, ?, ?)';
        await bd.query(consulta, [id_torneo, fase.trim(), monto_ganador, monto_perdedor]);
        res.redirect('/premios/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/premios/crear?status=error');
    }
};

// 4. Modificar
export const seleccionarModificar = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo_nombre 
            FROM Premios p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
        `;
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/modificarPremios', { premios, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [premio] = await bd.query('SELECT * FROM Premios WHERE id_premio = ?', [req.params.id]);
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        res.render('vistasPremios/editarPremio', { premio: premio[0], torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarPremio = async (req, res) => {
    try {
        const { id_torneo, fase, monto_ganador, monto_perdedor } = req.body;
        if (!validarId(id_torneo) || !validarFase(fase) || !validarMonto(monto_ganador) || !validarMonto(monto_perdedor)) {
            return res.redirect(`/premios/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        const consulta = 'UPDATE Premios SET id_torneo = ?, fase = ?, monto_ganador = ?, monto_perdedor = ? WHERE id_premio = ?';
        await bd.query(consulta, [id_torneo, fase.trim(), monto_ganador, monto_perdedor, req.params.id]);
        res.redirect('/premios/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/premios/modificar/${req.params.id}?status=error`);
    }
};

// 5. Eliminar
export const seleccionarEliminar = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo_nombre 
            FROM Premios p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
        `;
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/eliminarPremios', { premios, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarId(valor) {
    return /^[1-9]\d*$/.test(String(valor || ''));
}

function validarFase(valor) {
    return typeof valor === 'string' && valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ0-9\s.'-]+$/.test(valor.trim());
}

function validarMonto(valor) {
    const monto = Number(valor);
    return /^\d{1,8}(?:\.\d{1,2})?$/.test(String(valor || '')) && Number.isFinite(monto) && monto >= 0;
}

export const eliminarPremio = async (req, res) => {
    try {
        await bd.query('DELETE FROM Premios WHERE id_premio = ?', [req.params.id]);
        res.redirect('/premios/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/premios/eliminar?status=error&tipo=relacion');
    }
};

// CONSULTAS
// Cada fila de Premios es de un solo torneo, así que en estas consultas los premios se agrupan por fase
// (Final, Semifinal...) sumando todos los torneos.
// Los partidos de un premio son los del mismo torneo y la misma fase; el que gana el partido (es_ganador = 1) gana el premio.

// CONSULTA: Premios entregados en más/menos sedes diferentes
export const verPremiosPorSedes = async (req, res) => {
    try {
        const orden = req.query.orden || 'mas';
        // LEFT JOIN para que también aparezcan los premios que todavía no se entregaron (0 sedes)
        let consulta = `
            SELECT p.fase, COUNT(DISTINCT s.id_sede) AS sedes,
                   GROUP_CONCAT(DISTINCT s.nombre SEPARATOR ', ') AS nombres_sedes
            FROM Premios p
            LEFT JOIN Partidos pa ON p.id_torneo = pa.id_torneo AND p.fase = pa.fase
            LEFT JOIN Torneos t ON pa.id_torneo = t.id_torneo
            LEFT JOIN Sedes s ON t.id_sede = s.id_sede
            GROUP BY p.fase
        `;
        // "mas" ordena de mayor a menor (DESC) y "menos" de menor a mayor (ASC)
        if (orden === 'menos') {
            consulta += ' ORDER BY sedes ASC, p.fase';
        } else {
            consulta += ' ORDER BY sedes DESC, p.fase';
        }
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/premiosSedes', { premios, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los premios por sedes');
    }
};

// CONSULTA: Premios más/menos ganados por un país
export const verPremiosPorPais = async (req, res) => {
    try {
        const idPais = req.query.id_pais;
        const orden = req.query.orden || 'mas';

        // Traemos los países para el select del filtro
        const [paises] = await bd.query('SELECT * FROM Paises');

        let premios = [];
        if (idPais) {
            // Solo se cuentan los ganadores que tienen la nacionalidad elegida (condición en el LEFT JOIN)
            let consulta = `
                SELECT p.fase, COUNT(jn.id_jugador) AS ganados
                FROM Premios p
                LEFT JOIN Partidos pa ON p.id_torneo = pa.id_torneo AND p.fase = pa.fase
                LEFT JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido AND pp.es_ganador = 1
                LEFT JOIN Jugador_Nacionalidad jn ON pp.id_jugador = jn.id_jugador AND jn.id_pais = ?
                GROUP BY p.fase
            `;
            if (orden === 'menos') {
                consulta += ' ORDER BY ganados ASC, p.fase';
            } else {
                consulta += ' ORDER BY ganados DESC, p.fase';
            }
            const [resultado] = await bd.query(consulta, [idPais]);
            premios = resultado;
        }

        res.render('vistasPremios/premiosPorPais', { paises, premios, idPais, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los premios por país');
    }
};

// CONSULTA: Premios ganados únicamente en una sola sede
export const verPremiosUnaSede = async (req, res) => {
    try {
        // Para cada premio se cuenta en cuántas sedes distintas se ganó y cuántas veces se entregó
        const consulta = `
            SELECT p.fase, COUNT(DISTINCT s.id_sede) AS sedes,
                   GROUP_CONCAT(DISTINCT s.nombre) AS sede, COUNT(*) AS entregados
            FROM Premios p
            JOIN Partidos pa ON p.id_torneo = pa.id_torneo AND p.fase = pa.fase
            JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
            JOIN Torneos t ON pa.id_torneo = t.id_torneo
            JOIN Sedes s ON t.id_sede = s.id_sede
            WHERE pp.es_ganador = 1
            GROUP BY p.fase
            ORDER BY p.fase
        `;
        const [resultado] = await bd.query(consulta);
        // Solo quedan los premios que se ganaron en una única sede
        const premios = resultado.filter(premio => premio.sedes === 1);
        res.render('vistasPremios/premiosUnaSede', { premios });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los premios de una sola sede');
    }
};

// CONSULTA: Premios con más/menos jugadores postulados o ganadores
export const verPremiosPorJugadores = async (req, res) => {
    try {
        const criterio = req.query.criterio || 'postulados';
        const orden = req.query.orden || 'mas';
        // Postulados: los que jugaron un partido de ese premio. Ganadores: los que además lo ganaron
        let consulta = `
            SELECT p.fase,
                   COUNT(DISTINCT pp.id_jugador) AS postulados,
                   COUNT(DISTINCT CASE WHEN pp.es_ganador = 1 THEN pp.id_jugador END) AS ganadores
            FROM Premios p
            LEFT JOIN Partidos pa ON p.id_torneo = pa.id_torneo AND p.fase = pa.fase
            LEFT JOIN Participaciones_Partidos pp ON pa.id_partido = pp.id_partido
            GROUP BY p.fase
        `;
        // Se ordena por la columna elegida y después se agrega si es de más a menos o al revés
        if (criterio === 'ganadores') {
            consulta += ' ORDER BY ganadores';
        } else {
            consulta += ' ORDER BY postulados';
        }
        if (orden === 'menos') {
            consulta += ' ASC, p.fase';
        } else {
            consulta += ' DESC, p.fase';
        }
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/premiosJugadores', { premios, criterio, orden });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al consultar los premios por jugadores');
    }
};
