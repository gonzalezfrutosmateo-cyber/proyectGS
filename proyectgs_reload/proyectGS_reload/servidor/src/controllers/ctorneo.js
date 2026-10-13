import { conectar } from '../database/conexion.js';
import { listarPartidos, datosFiltros } from './cpartido.js';

const bdd = await conectar();

const avisos = {
    alta: 'Edición agregada correctamente.',
    baja: 'Edición eliminada correctamente.',
    mod: 'Edición modificada correctamente.'
};

// Ediciones (cada año de cada torneo) con su sede y la cantidad de partidos cargados
const sqlediciones = `
    SELECT e.id_edicion, e.anio, e.TORNEO_id_torneo AS id_torneo, t.nombre AS torneo,
        s.nombre AS sede, pa.nombre AS pais,
        (SELECT COUNT(*) FROM PARTIDO p WHERE p.EDICION_id_edicion = e.id_edicion) AS partidos
    FROM EDICION e
    JOIN TORNEO t ON t.id_torneo = e.TORNEO_id_torneo
    JOIN SEDE s ON s.id_sede = e.SEDE_id_sede
    JOIN PAIS pa ON pa.id_pais = s.PAIS_id_pais`;

async function listarEdiciones(filtros) {
    let sql = sqlediciones;
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
    if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
    }
    sql += ' ORDER BY e.anio DESC, t.nombre';

    const [filas] = await bdd.query(sql, valores);
    return filas;
}

async function obtenerEdicion(id) {
    const [filas] = await bdd.query(sqlediciones + ' WHERE e.id_edicion = ?', [id]);
    return filas[0];
}

function leerFiltros(query) {
    return {
        torneo: query.torneo || '',
        anio: query.anio || ''
    };
}

// Torneos y sedes para el formulario (al modificar se incluye el torneo actual aunque esté inactivo)
async function datosFormulario(idtorneo) {
    const [torneos] = await bdd.query('SELECT id_torneo, nombre FROM TORNEO WHERE activo = 1 OR id_torneo = ? ORDER BY nombre', [idtorneo || 0]);
    const [sedes] = await bdd.query('SELECT DISTINCT nombre FROM SEDE ORDER BY nombre');
    return { torneos, sedes };
}

// Busca la sede en el país del torneo; si no existe la agrega a la tabla SEDE
async function obtenerSede(idtorneo, nombre) {
    const [torneo] = await bdd.query('SELECT PAIS_id_pais FROM TORNEO WHERE id_torneo = ?', [idtorneo]);
    const idpais = torneo[0].PAIS_id_pais;

    const [filas] = await bdd.query('SELECT id_sede FROM SEDE WHERE nombre = ? AND PAIS_id_pais = ?', [nombre, idpais]);
    if (filas.length > 0) {
        return filas[0].id_sede;
    }
    const [nueva] = await bdd.query('INSERT INTO SEDE (nombre, PAIS_id_pais) VALUES (?, ?)', [nombre, idpais]);
    return nueva.insertId;
}

function leerEdicion(body) {
    return {
        id_edicion: body.id || '',
        id_torneo: body.torneo || '',
        anio: (body.anio || '').trim(),
        sede: (body.sede || '').trim()
    };
}

function validarEdicion(edicion) {
    if (!edicion.id_torneo || !edicion.anio || !edicion.sede) {
        return 'Completá el torneo, el año y la sede.';
    }
    if (!/^\d{4}$/.test(edicion.anio) || Number(edicion.anio) < 1877) {
        return 'El año tiene que ser de 4 cifras (el primer Grand Slam se jugó en 1877).';
    }
    return '';
}

// Menú de torneos
export const torneos = (pet, resp) => {
    resp.render('torneos');
};

// ---------- ALTA (nueva edición de un torneo) ----------
export const altator = async (pet, resp) => {
    const datos = await datosFormulario();
    resp.render('altator', { ...datos, edicion: leerEdicion({}), error: '' });
};

export const nuevotor = async (pet, resp) => {
    const edicion = leerEdicion(pet.body);
    const error = validarEdicion(edicion);
    if (error) {
        const datos = await datosFormulario();
        return resp.render('altator', { ...datos, edicion, error });
    }

    try {
        const idsede = await obtenerSede(edicion.id_torneo, edicion.sede);

        let altasql = 'INSERT INTO EDICION (anio, TORNEO_id_torneo, SEDE_id_sede) VALUES (?, ?, ?)';
        const [registro] = await bdd.query(altasql, [edicion.anio, edicion.id_torneo, idsede]);

        resp.redirect('/mostrartor?msg=alta');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        let texto = 'No se pudo guardar la edición.';
        if (error.code === 'ER_DUP_ENTRY') {
            texto = 'Esa edición ya está cargada (mismo torneo y mismo año).';
        }
        const datos = await datosFormulario();
        resp.render('altator', { ...datos, edicion, error: texto });
    }
};

// ---------- BAJA ----------
// EDICION no tiene columna activo: se borra, pero solo si no tiene partidos cargados.
export const bajator = async (pet, resp) => {
    const filtros = leerFiltros(pet.query);
    const lista = await listarEdiciones(filtros);
    const datos = await datosFiltros();
    resp.render('bajator', { ...datos, filtros, ediciones: lista, mensaje: avisos[pet.query.msg] || '', error: '' });
};

export const eliminartor = async (pet, resp) => {
    let id = pet.body.id;
    try {
        let bajasql = 'DELETE FROM EDICION WHERE id_edicion = ?';
        await bdd.query(bajasql, [id]);

        resp.redirect('/bajator?msg=baja');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        let texto = 'No se pudo eliminar la edición.';
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            texto = 'No se puede eliminar la edición porque tiene partidos cargados. Eliminá primero esos partidos.';
        }
        const lista = await listarEdiciones({});
        const datos = await datosFiltros();
        resp.render('bajator', { ...datos, filtros: leerFiltros({}), ediciones: lista, mensaje: '', error: texto });
    }
};

// ---------- MODIFICACIÓN ----------
export const modtor = async (pet, resp) => {
    const id = pet.query.id;
    if (id) {
        const edicion = await obtenerEdicion(id);
        if (!edicion) {
            return resp.redirect('/modtor');
        }
        const datos = await datosFormulario(edicion.id_torneo);
        return resp.render('modtor', { ...datos, edicion, error: '' });
    }

    const filtros = leerFiltros(pet.query);
    const lista = await listarEdiciones(filtros);
    const datos = await datosFiltros();
    resp.render('modtor', { ...datos, filtros, ediciones: lista, edicion: null });
};

export const actualizartor = async (pet, resp) => {
    const edicion = leerEdicion(pet.body);
    const error = validarEdicion(edicion);
    if (error) {
        const datos = await datosFormulario(edicion.id_torneo);
        return resp.render('modtor', { ...datos, edicion, error });
    }

    try {
        const idsede = await obtenerSede(edicion.id_torneo, edicion.sede);

        let modsql = 'UPDATE EDICION SET anio = ?, TORNEO_id_torneo = ?, SEDE_id_sede = ? WHERE id_edicion = ?';
        await bdd.query(modsql, [edicion.anio, edicion.id_torneo, idsede, edicion.id_edicion]);

        resp.redirect('/mostrartor?msg=mod');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        let texto = 'No se pudo modificar la edición.';
        if (error.code === 'ER_DUP_ENTRY') {
            texto = 'Ya existe otra edición de ese torneo en ese año.';
        }
        const datos = await datosFormulario(edicion.id_torneo);
        resp.render('modtor', { ...datos, edicion, error: texto });
    }
};

// ---------- MOSTRAR TODOS ----------
export const mostrartor = async (pet, resp) => {
    const [listatorneos] = await bdd.query(`
        SELECT t.nombre, pa.nombre AS pais,
            (SELECT COUNT(*) FROM EDICION e WHERE e.TORNEO_id_torneo = t.id_torneo) AS ediciones
        FROM TORNEO t
        JOIN PAIS pa ON pa.id_pais = t.PAIS_id_pais
        WHERE t.activo = 1
        ORDER BY t.nombre`);
    const lista = await listarEdiciones({});
    resp.render('mostrartor', { torneos: listatorneos, ediciones: lista, mensaje: avisos[pet.query.msg] || '' });
};

// ---------- CONSULTA (partidos de un torneo en un año) ----------
export const consultartor = async (pet, resp) => {
    const filtros = leerFiltros(pet.query);
    const datos = await datosFiltros();
    let edicion = null;
    let lista = null;

    if (filtros.torneo && filtros.anio) {
        const ediciones = await listarEdiciones(filtros);
        edicion = ediciones[0] || null;
        lista = edicion ? await listarPartidos(filtros) : [];
    }
    resp.render('consultartor', { ...datos, filtros, edicion, partidos: lista });
};
