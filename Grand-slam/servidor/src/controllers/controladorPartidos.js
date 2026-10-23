import { conectar } from "../database/conexion.js";
const bd = await conectar();

const normalizarIds = (valor) => {
    const ids = valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];
    const normalizados = ids.map(Number);

    if (normalizados.some(id => !Number.isInteger(id) || id < 1)) {
        throw new Error('La selección de jugadores no es válida');
    }

    return normalizados;
};

const validarDatosPartido = (fase, resultado, torneo, modalidad, arbitro) => {
    const patronFase = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ0-9\s.'-]+$/;
    const patronResultado = /^[0-9]+-[0-9]+(?:[\s/]+[0-9]+-[0-9]+)*$/;
    return typeof fase === 'string' && fase.trim().length <= 50 && patronFase.test(fase.trim()) &&
        typeof resultado === 'string' && resultado.trim().length <= 50 && patronResultado.test(resultado.trim()) &&
        [torneo, modalidad, arbitro].every(id => /^[1-9]\d*$/.test(String(id || '')));
};

// Junta los sets elegidos en los desplegables en un solo texto, ej: "6-3 4-6 7-5"
const armarResultado = (valor) => {
    const sets = valor === undefined ? [] : Array.isArray(valor) ? valor : [valor];
    const jugados = sets.filter(set => set !== '');

    // El ganador del partido tiene que haber ganado más de la mitad de los sets
    let setsGanados = 0;
    for (const set of jugados) {
        const [gamesGanador, gamesRival] = set.split('-').map(Number);
        if (gamesGanador > gamesRival) setsGanados++;
    }
    if (jugados.length < 2 || setsGanados <= jugados.length / 2) {
        return ''; // vacío = resultado inválido, lo rechaza validarDatosPartido
    }
    return jugados.join(' ');
};

const validarParticipantes = async (conexion, idModalidad, idsJugadores, idsGanadores) => {
    const [modalidades] = await conexion.query(
        'SELECT nombre FROM Modalidades WHERE id_modalidad = ?',
        [idModalidad]
    );
    if (modalidades.length === 0) {
        throw new Error('La modalidad seleccionada no existe');
    }

    const cantidadPorEquipo = modalidades[0].nombre.toLowerCase().includes('dobles') ? 2 : 1;
    const cantidadEsperada = cantidadPorEquipo * 2;

    if (idsJugadores.length !== cantidadEsperada || idsGanadores.length !== cantidadPorEquipo) {
        throw new Error(`La modalidad requiere ${cantidadEsperada} participantes y ${cantidadPorEquipo} ganador(es)`);
    }
    if (new Set(idsJugadores).size !== idsJugadores.length || new Set(idsGanadores).size !== idsGanadores.length) {
        throw new Error('No se pueden repetir los jugadores seleccionados');
    }
    if (idsGanadores.some(id => !idsJugadores.includes(id))) {
        throw new Error('Los ganadores deben estar entre los participantes');
    }

};

const guardarEquiposDelPartido = async (conexion, idPartido, idsJugadores, idsGanadores) => {
    // Cada jugador que participó se guarda con 1 si ganó o 0 si perdió
    for (const idJugador of idsJugadores) {
        const esGanador = idsGanadores.includes(idJugador) ? 1 : 0;
        await conexion.query(
            'INSERT INTO Participaciones_Partidos (id_partido, id_jugador, es_ganador) VALUES (?, ?, ?)',
            [idPartido, idJugador, esGanador]
        );
    }
};

// 1. Menú
export const menuPartidos = (req, res) => {
    res.render('vistasPartidos/menuPartidos');
};


// 2. Ver (Traemos los datos de las tablas relacionadas)
export const listarPartidos = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo, t.anio, m.nombre AS modalidad, CONCAT(a.nombre, ' ', a.apellido) AS arbitro
            FROM Partidos p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
            JOIN Modalidades m ON p.id_modalidad = m.id_modalidad
            JOIN Arbitros a ON p.id_arbitro = a.id_arbitro
        `;
        const [partidos] = await bd.query(consulta);
        res.render('vistasPartidos/verPartidos', { partidos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al listar partidos');
    }
};

// Buscar: por categoría (modalidad) y/o por torneo o fase. Solo muestra resultados después de buscar
export const buscarPartidos = async (req, res) => {
    try {
        const idModalidad = req.query.id_modalidad || '';
        const buscar = req.query.buscar || '';
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');

        let partidos = [];
        if (idModalidad || buscar) {
            // "WHERE 1 = 1" siempre es verdadero; sirve para ir sumando condiciones con AND
            let consulta = `
                SELECT p.*, t.nombre AS torneo, t.anio, m.nombre AS modalidad, CONCAT(a.nombre, ' ', a.apellido) AS arbitro
                FROM Partidos p
                JOIN Torneos t ON p.id_torneo = t.id_torneo
                JOIN Modalidades m ON p.id_modalidad = m.id_modalidad
                JOIN Arbitros a ON p.id_arbitro = a.id_arbitro
                WHERE 1 = 1
            `;
            const parametros = [];
            if (idModalidad) {
                consulta += ' AND p.id_modalidad = ?';
                parametros.push(idModalidad);
            }
            if (buscar) {
                consulta += ' AND (t.nombre LIKE ? OR p.fase LIKE ?)';
                parametros.push(`%${buscar}%`, `%${buscar}%`);
            }
            const [resultado] = await bd.query(consulta, parametros);
            partidos = resultado;
        }
        res.render('vistasPartidos/buscarPartidos', { partidos, modalidades, idModalidad, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar partidos');
    }
};

// 3. Crear
export const formularioCrear = async (req, res) => {
    try {
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');
        const [arbitros] = await bd.query('SELECT * FROM Arbitros');
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');

        res.render('vistasPartidos/crearPartidos', { torneos, modalidades, arbitros, jugadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearPartido = async (req, res) => {
    let conexion;
    let transaccionIniciada = false;
    try {
        const { id_torneo, id_modalidad, id_arbitro, fase } = req.body;
        const resultado = armarResultado(req.body.sets);
        const idsJugadores = normalizarIds(req.body.jugadores);
        const idsGanadores = normalizarIds(req.body.ganadores);
        if (!validarDatosPartido(fase, resultado, id_torneo, id_modalidad, id_arbitro)) {
            return res.redirect('/partidos/crear?status=error&tipo=datos');
        }

        conexion = await bd.getConnection();
        await conexion.beginTransaction();
        transaccionIniciada = true;
        await validarParticipantes(conexion, Number(id_modalidad), idsJugadores, idsGanadores);

        const consultaPartido = 'INSERT INTO Partidos (id_torneo, id_modalidad, id_arbitro, fase, resultado) VALUES (?, ?, ?, ?, ?)';
        const [resPartido] = await conexion.query(consultaPartido, [id_torneo, id_modalidad, id_arbitro, fase.trim(), resultado.trim()]);
        const idPartido = resPartido.insertId;
        await guardarEquiposDelPartido(conexion, idPartido, idsJugadores, idsGanadores);
        await conexion.commit();
        transaccionIniciada = false;
        res.redirect('/partidos/ver?status=success');
    } catch (error) {
        console.error(error);
        if (transaccionIniciada) {
            try {
                await conexion.rollback();
            } catch (rollbackError) {
                console.error('Error al revertir la creación del partido:', rollbackError);
            }
        }
        res.redirect('/partidos/crear?status=error&tipo=datos');
    } finally {
        if (conexion) conexion.release();
    }
};


// 4. Modificar
export const seleccionarModificar = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo, m.nombre AS modalidad
            FROM Partidos p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
            JOIN Modalidades m ON p.id_modalidad = m.id_modalidad
        `;
        const [partidos] = await bd.query(consulta);
        res.render('vistasPartidos/modificarPartidos', { partidos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [partido] = await bd.query('SELECT * FROM Partidos WHERE id_partido = ?', [req.params.id]);
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');
        const [arbitros] = await bd.query('SELECT * FROM Arbitros');
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');

        const [participaciones] = await bd.query(`
            SELECT pp.id_jugador, pp.es_ganador
            FROM Participaciones_Partidos pp
            WHERE pp.id_partido = ?
        `, [req.params.id]);

        res.render('vistasPartidos/editarPartido', {
            partido: partido[0], torneos, modalidades, arbitros, jugadores, participaciones, status: req.query.status, tipo: req.query.tipo
        });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarPartido = async (req, res) => {
    let conexion;
    let transaccionIniciada = false;
    try {
        const idPartido = req.params.id;
        const { id_torneo, id_modalidad, id_arbitro, fase } = req.body;
        const resultado = armarResultado(req.body.sets);
        const idsJugadores = normalizarIds(req.body.jugadores);
        const idsGanadores = normalizarIds(req.body.ganadores);
        if (!validarDatosPartido(fase, resultado, id_torneo, id_modalidad, id_arbitro)) {
            return res.redirect(`/partidos/modificar/${req.params.id}?status=error&tipo=datos`);
        }

        conexion = await bd.getConnection();
        await conexion.beginTransaction();
        transaccionIniciada = true;
        await validarParticipantes(conexion, Number(id_modalidad), idsJugadores, idsGanadores);

        await conexion.query(
            'UPDATE Partidos SET id_torneo = ?, id_modalidad = ?, id_arbitro = ?, fase = ?, resultado = ? WHERE id_partido = ?',
            [id_torneo, id_modalidad, id_arbitro, fase.trim(), resultado.trim(), idPartido]
        );

        // Se borran los jugadores anteriores del partido y se guardan los nuevos
        await conexion.query('DELETE FROM Participaciones_Partidos WHERE id_partido = ?', [idPartido]);
        await guardarEquiposDelPartido(conexion, idPartido, idsJugadores, idsGanadores);
        await conexion.commit();
        transaccionIniciada = false;
        res.redirect('/partidos/ver?status=success');
    } catch (error) {
        console.error(error);
        if (transaccionIniciada) {
            try {
                await conexion.rollback();
            } catch (rollbackError) {
                console.error('Error al revertir la edición del partido:', rollbackError);
            }
        }
        res.redirect(`/partidos/modificar/${req.params.id}?status=error&tipo=datos`);
    } finally {
        if (conexion) conexion.release();
    }
};

// 5. Eliminar
export const seleccionarEliminar = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo, m.nombre AS modalidad
            FROM Partidos p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
            JOIN Modalidades m ON p.id_modalidad = m.id_modalidad
        `;
        const [partidos] = await bd.query(consulta);
        res.render('vistasPartidos/eliminarPartidos', { partidos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const eliminarPartido = async (req, res) => {
    let conexion;
    let transaccionIniciada = false;
    try {
        conexion = await bd.getConnection();
        await conexion.beginTransaction();
        transaccionIniciada = true;
        // Las participaciones del partido se borran solas por el ON DELETE CASCADE
        await conexion.query('DELETE FROM Partidos WHERE id_partido = ?', [req.params.id]);
        await conexion.commit();
        transaccionIniciada = false;
        res.redirect('/partidos/eliminar?status=success');
    } catch (error) {
        console.error(error);
        if (transaccionIniciada) {
            try {
                await conexion.rollback();
            } catch (rollbackError) {
                console.error('Error al revertir la eliminación del partido:', rollbackError);
            }
        }
        res.redirect('/partidos/eliminar?status=error&tipo=relacion');
    } finally {
        if (conexion) conexion.release();
    }
};

// 6. CONSULTA EXTRA: Historial de partidos de un jugador
export const verPartidosPorJugador = async (req, res) => {
    try {
        const idJugador = req.query.id_jugador;
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');

        let partidos = [];
        if (idJugador) {
            const consulta = `
                SELECT p.id_partido, t.nombre AS torneo, t.anio, p.fase, p.resultado, m.nombre AS modalidad,
                       GROUP_CONCAT(DISTINCT CONCAT(j2.nombre, ' ', j2.apellido) SEPARATOR ' / ') AS rivales_companeros,
                       pp1.es_ganador
                FROM Partidos p
                JOIN Torneos t ON p.id_torneo = t.id_torneo
                JOIN Modalidades m ON p.id_modalidad = m.id_modalidad
                JOIN Participaciones_Partidos pp1 ON p.id_partido = pp1.id_partido
                LEFT JOIN Participaciones_Partidos pp2 ON p.id_partido = pp2.id_partido AND pp2.es_ganador != pp1.es_ganador
                LEFT JOIN Jugadores j2 ON pp2.id_jugador = j2.id_jugador
                WHERE pp1.id_jugador = ?
                GROUP BY p.id_partido, pp1.es_ganador
            `;
            const [resultado] = await bd.query(consulta, [idJugador]);
            partidos = resultado;
        }

        res.render('vistasPartidos/partidosJugador', { jugadores, partidos, idJugador });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar partidos del jugador');
    }
};