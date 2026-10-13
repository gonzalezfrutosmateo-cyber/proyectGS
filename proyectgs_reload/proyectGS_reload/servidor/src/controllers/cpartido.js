import { conectar } from '../database/conexion.js';

const bdd = await conectar();

const avisos = {
    alta: 'Partido agregado correctamente.',
    baja: 'Partido eliminado correctamente.',
    mod: 'Partido modificado correctamente.'
};

// Valores posibles de los ENUM de la tabla PARTIDO
const fases = ['R128', 'R64', 'R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];

const modalidades = {
    'individual-masculino': 'Individual Masculino',
    'individual-femenino': 'Individual Femenino',
    'dobles-masculino': 'Dobles Masculino',
    'dobles-femenino': 'Dobles Femenino',
    'dobles-mixto': 'Dobles Mixto'
};

const estados = {
    jugado: 'Jugado',
    abandono: 'Abandono',
    walkover: 'Walkover'
};

// Partidos con su torneo, ganador/es, perdedor/es, resultado set por set, árbitro y premio del perdedor
const sqlpartidos = `
    SELECT p.id_partido, t.nombre AS torneo, e.anio, DATE_FORMAT(p.fecha, '%d/%m/%Y') AS fecha,
        p.fase, p.modalidad, p.estado,
        (SELECT GROUP_CONCAT(CONCAT(j.nombre, ' ', j.apellido) ORDER BY j.apellido SEPARATOR ' / ')
            FROM PARTIDO_JUGADOR pj
            JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
            WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'ganador') AS ganador,
        (SELECT GROUP_CONCAT(CONCAT(j.nombre, ' ', j.apellido) ORDER BY j.apellido SEPARATOR ' / ')
            FROM PARTIDO_JUGADOR pj
            JOIN JUGADOR j ON j.id_jugador = pj.JUGADOR_id_jugador
            WHERE pj.PARTIDO_id_partido = p.id_partido AND pj.rol = 'perdedor') AS perdedor,
        (SELECT GROUP_CONCAT(CONCAT(rs.games_ganador, '-', rs.games_perdedor) ORDER BY rs.nro_set SEPARATOR ' ')
            FROM RESULTADO_SET rs
            WHERE rs.PARTIDO_id_partido = p.id_partido) AS resultado,
        CONCAT(a.nombre, ' ', a.apellido) AS arbitro,
        pr.monto_perdedor
    FROM PARTIDO p
    JOIN EDICION e ON e.id_edicion = p.EDICION_id_edicion
    JOIN TORNEO t ON t.id_torneo = e.TORNEO_id_torneo
    JOIN ARBITRO a ON a.id_arbitro = p.ARBITRO_id_arbitro
    LEFT JOIN PREMIO pr ON pr.EDICION_id_edicion = p.EDICION_id_edicion
        AND pr.modalidad = p.modalidad AND pr.fase = p.fase`;

// Lista de partidos filtrada por torneo, año y/o modalidad 
export async function listarPartidos(filtros) {
    let sql = sqlpartidos;
    let condiciones = [];
    let valores = [];

    if (filtros.torneo) {
        condiciones.push('t.id_torneo = ?');
        valores.push(filtros.torneo);
    }
    if (filtros.anio) {
        condiciones.push('e.anio = ?');
        valores.push(filtros.anio);
    }
    if (filtros.modalidad) {
        condiciones.push('p.modalidad = ?');
        valores.push(filtros.modalidad);
    }
    if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
    }
    sql += ' ORDER BY e.anio DESC, t.nombre, p.modalidad, p.fase DESC, p.fecha DESC';

    const [filas] = await bdd.query(sql, valores);
    for (const fila of filas) {
        fila.modalidad_texto = modalidades[fila.modalidad];
    }
    return filas;
}

// Torneos y años para los selects de búsqueda 
export async function datosFiltros() {
    const [torneos] = await bdd.query('SELECT id_torneo, nombre FROM TORNEO ORDER BY nombre');
    const [anios] = await bdd.query('SELECT DISTINCT anio FROM EDICION ORDER BY anio DESC');
    return { torneos, anios: anios.map(fila => fila.anio) };
}

function leerFiltros(query) {
    return {
        torneo: query.torneo || '',
        anio: query.anio || '',
        modalidad: query.modalidad || ''
    };
}

// Datos para los selects del formulario de alta / modificación.
// Se traen los árbitros y jugadores activos y, al modificar, también los que ya estaban en el partido.
async function datosFormulario(partido) {
    const [ediciones] = await bdd.query(`
        SELECT e.id_edicion, t.nombre AS torneo, e.anio
        FROM EDICION e
        JOIN TORNEO t ON t.id_torneo = e.TORNEO_id_torneo
        ORDER BY e.anio DESC, t.nombre`);

    const [arbitros] = await bdd.query(
        'SELECT id_arbitro, nombre, apellido FROM ARBITRO WHERE activo = 1 OR id_arbitro = ? ORDER BY apellido, nombre',
        [partido.arbitro || 0]);

    let ids = [partido.ganador1, partido.ganador2, partido.perdedor1, partido.perdedor2].filter(id => id !== '');
    if (ids.length === 0) {
        ids = [0];
    }
    const [jugadores] = await bdd.query(
        'SELECT id_jugador, nombre, apellido FROM JUGADOR WHERE activo = 1 OR id_jugador IN (?) ORDER BY apellido, nombre',
        [ids]);

    return { ediciones, arbitros, jugadores };
}

async function mostrarFormulario(resp, vista, partido, error) {
    const datos = await datosFormulario(partido);
    resp.render(vista, { ...datos, partido, error, fases, modalidades, estados });
}

function partidoVacio() {
    const partido = {
        id: '', edicion: '', fecha: '', fase: '', modalidad: '', estado: 'jugado', arbitro: '',
        ganador1: '', ganador2: '', perdedor1: '', perdedor2: '', sets: []
    };
    for (let i = 0; i < 5; i++) {
        partido.sets.push({ ganador: '', perdedor: '' });
    }
    return partido;
}

// Arma el partido con lo que llega del formulario
function leerPartido(body) {
    const partido = {
        id: body.id || '',
        edicion: body.edicion || '',
        fecha: body.fecha || '',
        fase: body.fase || '',
        modalidad: body.modalidad || '',
        estado: body.estado || '',
        arbitro: body.arbitro || '',
        ganador1: body.ganador1 || '',
        ganador2: body.ganador2 || '',
        perdedor1: body.perdedor1 || '',
        perdedor2: body.perdedor2 || '',
        sets: []
    };
    for (let i = 1; i <= 5; i++) {
        partido.sets.push({
            ganador: (body['set' + i + 'g'] || '').trim(),
            perdedor: (body['set' + i + 'p'] || '').trim()
        });
    }
    return partido;
}

function esGames(valor) {
    return /^\d{1,3}$/.test(valor) && Number(valor) <= 127;
}

// Devuelve el mensaje de error, o '' si el partido está bien cargado
function validarPartido(partido) {
    if (!partido.edicion || !partido.fecha || !partido.arbitro || !partido.ganador1 || !partido.perdedor1) {
        return 'Completá todos los datos obligatorios.';
    }
    if (!fases.includes(partido.fase) || !modalidades[partido.modalidad] || !estados[partido.estado]) {
        return 'Elegí la fase, la modalidad y el estado del partido.';
    }

    const dobles = partido.modalidad.startsWith('dobles');
    if (dobles && (!partido.ganador2 || !partido.perdedor2)) {
        return 'En dobles hay que elegir dos ganadores y dos perdedores.';
    }
    if (!dobles) {
        partido.ganador2 = '';
        partido.perdedor2 = '';
    }

    const ids = [partido.ganador1, partido.ganador2, partido.perdedor1, partido.perdedor2].filter(id => id !== '');
    if (new Set(ids).size !== ids.length) {
        return 'Un mismo jugador no puede aparecer dos veces en el partido.';
    }

    let setscargados = 0;
    for (let i = 0; i < partido.sets.length; i++) {
        const set = partido.sets[i];
        if (set.ganador === '' && set.perdedor === '') {
            continue;
        }
        if (!esGames(set.ganador) || !esGames(set.perdedor)) {
            return `Revisá los games del set ${i + 1}.`;
        }
        setscargados++;
    }
    if (partido.estado !== 'walkover' && setscargados === 0) {
        return 'Cargá el resultado de al menos un set.';
    }
    return '';
}

// Guarda los jugadores y los sets  del partido.
// Primero borra los que tenía, así sirve tanto para el alta como para la modificación.
async function guardarDetalle(idpar, partido) {
    await bdd.query('DELETE FROM PARTIDO_JUGADOR WHERE PARTIDO_id_partido = ?', [idpar]);
    await bdd.query('DELETE FROM RESULTADO_SET WHERE PARTIDO_id_partido = ?', [idpar]);

    const participantes = [
        [partido.ganador1, 'ganador'],
        [partido.ganador2, 'ganador'],
        [partido.perdedor1, 'perdedor'],
        [partido.perdedor2, 'perdedor']
    ];
    for (const [idjug, rol] of participantes) {
        if (idjug !== '') {
            let jugsql = 'INSERT INTO PARTIDO_JUGADOR (rol, PARTIDO_id_partido, JUGADOR_id_jugador) VALUES (?, ?, ?)';
            await bdd.query(jugsql, [rol, idpar, idjug]);
        }
    }

    let nroset = 0;
    for (const set of partido.sets) {
        if (set.ganador !== '' && set.perdedor !== '') {
            nroset++;
            let setsql = 'INSERT INTO RESULTADO_SET (PARTIDO_id_partido, nro_set, games_ganador, games_perdedor) VALUES (?, ?, ?, ?)';
            await bdd.query(setsql, [idpar, nroset, set.ganador, set.perdedor]);
        }
    }
}

// Trae un partido de la base con el mismo formato que usa el formulario
async function obtenerPartido(id) {
    const [filas] = await bdd.query(`
        SELECT id_partido, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, fase, modalidad, estado,
            EDICION_id_edicion, ARBITRO_id_arbitro
        FROM PARTIDO
        WHERE id_partido = ?`, [id]);
    if (filas.length === 0) {
        return null;
    }
    const [jugadores] = await bdd.query('SELECT JUGADOR_id_jugador, rol FROM PARTIDO_JUGADOR WHERE PARTIDO_id_partido = ?', [id]);
    const [sets] = await bdd.query('SELECT games_ganador, games_perdedor FROM RESULTADO_SET WHERE PARTIDO_id_partido = ? ORDER BY nro_set', [id]);

    const ganadores = jugadores.filter(j => j.rol === 'ganador').map(j => String(j.JUGADOR_id_jugador));
    const perdedores = jugadores.filter(j => j.rol === 'perdedor').map(j => String(j.JUGADOR_id_jugador));

    const partido = {
        id: String(filas[0].id_partido),
        edicion: String(filas[0].EDICION_id_edicion),
        fecha: filas[0].fecha,
        fase: filas[0].fase,
        modalidad: filas[0].modalidad,
        estado: filas[0].estado,
        arbitro: String(filas[0].ARBITRO_id_arbitro),
        ganador1: ganadores[0] || '',
        ganador2: ganadores[1] || '',
        perdedor1: perdedores[0] || '',
        perdedor2: perdedores[1] || '',
        sets: []
    };
    for (let i = 0; i < 5; i++) {
        partido.sets.push({
            ganador: sets[i] ? String(sets[i].games_ganador) : '',
            perdedor: sets[i] ? String(sets[i].games_perdedor) : ''
        });
    }
    return partido;
}

// Menú de partidos
export const partidos = (pet, resp) => {
    resp.render('partidos');
};

// ALTA
export const altapar = async (pet, resp) => {
    await mostrarFormulario(resp, 'altapar', partidoVacio(), '');
};

export const nuevopar = async (pet, resp) => {
    const partido = leerPartido(pet.body);
    const error = validarPartido(partido);
    if (error) {
        return mostrarFormulario(resp, 'altapar', partido, error);
    }

    try {
        await bdd.beginTransaction();

        let altasql = `INSERT INTO PARTIDO (fecha, fase, modalidad, estado, EDICION_id_edicion, ARBITRO_id_arbitro)
            VALUES (?, ?, ?, ?, ?, ?)`;
        const [registro] = await bdd.query(altasql, [partido.fecha, partido.fase, partido.modalidad, partido.estado, partido.edicion, partido.arbitro]);
        await guardarDetalle(registro.insertId, partido);

        await bdd.commit();
        resp.redirect('/mostrarpar?msg=alta');
    } catch (error) {
        await bdd.rollback();
        console.log("Error en la sentencia:", error);
        await mostrarFormulario(resp, 'altapar', partido, 'No se pudo guardar el partido.');
    }
};

// BAJA
// Los partidos no tienen columna activo, así que se borran junto con sus jugadores y sets.
export const bajapar = async (pet, resp) => {
    const filtros = leerFiltros(pet.query);
    const lista = await listarPartidos(filtros);
    const datos = await datosFiltros();
    resp.render('bajapar', { ...datos, modalidades, filtros, partidos: lista, mensaje: avisos[pet.query.msg] || '', error: '' });
};

export const eliminarpar = async (pet, resp) => {
    let id = pet.body.id;
    try {
        await bdd.beginTransaction();

        await bdd.query('DELETE FROM RESULTADO_SET WHERE PARTIDO_id_partido = ?', [id]);
        await bdd.query('DELETE FROM PARTIDO_JUGADOR WHERE PARTIDO_id_partido = ?', [id]);
        let bajasql = 'DELETE FROM PARTIDO WHERE id_partido = ?';
        await bdd.query(bajasql, [id]);

        await bdd.commit();
        resp.redirect('/bajapar?msg=baja');
    } catch (error) {
        await bdd.rollback();
        console.log("Error en la sentencia:", error);
        const lista = await listarPartidos({});
        const datos = await datosFiltros();
        resp.render('bajapar', { ...datos, modalidades, filtros: leerFiltros({}), partidos: lista, mensaje: '', error: 'No se pudo eliminar el partido.' });
    }
};

// MODIFICACIÓN
export const modpar = async (pet, resp) => {
    const id = pet.query.id;
    if (id) {
        const partido = await obtenerPartido(id);
        if (!partido) {
            return resp.redirect('/modpar');
        }
        return mostrarFormulario(resp, 'modpar', partido, '');
    }

    const filtros = leerFiltros(pet.query);
    const lista = await listarPartidos(filtros);
    const datos = await datosFiltros();
    resp.render('modpar', { ...datos, modalidades, filtros, partidos: lista, partido: null });
};

export const actualizarpar = async (pet, resp) => {
    const partido = leerPartido(pet.body);
    const error = validarPartido(partido);
    if (error) {
        return mostrarFormulario(resp, 'modpar', partido, error);
    }

    try {
        await bdd.beginTransaction();

        let modsql = `UPDATE PARTIDO
            SET fecha = ?, fase = ?, modalidad = ?, estado = ?, EDICION_id_edicion = ?, ARBITRO_id_arbitro = ?
            WHERE id_partido = ?`;
        await bdd.query(modsql, [partido.fecha, partido.fase, partido.modalidad, partido.estado, partido.edicion, partido.arbitro, partido.id]);
        await guardarDetalle(partido.id, partido);

        await bdd.commit();
        resp.redirect('/mostrarpar?msg=mod');
    } catch (error) {
        await bdd.rollback();
        console.log("Error en la sentencia:", error);
        await mostrarFormulario(resp, 'modpar', partido, 'No se pudo modificar el partido.');
    }
};

// MOSTRAR TODOS
export const mostrarpar = async (pet, resp) => {
    const lista = await listarPartidos({});
    resp.render('mostrarpar', { partidos: lista, mensaje: avisos[pet.query.msg] || '' });
};

// CONSULTA
export const consultarpar = async (pet, resp) => {
    const filtros = leerFiltros(pet.query);
    const datos = await datosFiltros();
    let lista = null;
    if (pet.query.torneo !== undefined) {
        lista = await listarPartidos(filtros);
    }
    resp.render('consultarpar', { ...datos, modalidades, filtros, partidos: lista });
};
