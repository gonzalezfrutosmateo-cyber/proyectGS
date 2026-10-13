import { conectar } from '../database/conexion.js';

const bdd = await conectar();

const avisos = {
    alta: 'Entrenador agregado correctamente.',
    baja: 'Entrenador dado de baja correctamente.',
    mod: 'Entrenador modificado correctamente.'
};

// Entrenadores activos con los jugadores que entrenaron (tabla ENTRENAMIENTO)
const sqlentrenadores = `
    SELECT e.id_entrenador, e.nombre, e.apellido,
        (SELECT GROUP_CONCAT(DISTINCT CONCAT(j.nombre, ' ', j.apellido) SEPARATOR ', ')
            FROM ENTRENAMIENTO en
            JOIN JUGADOR j ON j.id_jugador = en.JUGADOR_id_jugador
            WHERE en.ENTRENADOR_id_entrenador = e.id_entrenador) AS jugadores
    FROM ENTRENADOR e
    WHERE e.activo = 1`;

async function listarEntrenadores(apellido) {
    let sql = sqlentrenadores;
    let valores = [];
    if (apellido) {
        sql += ' AND e.apellido LIKE ?';
        valores.push(`%${apellido}%`);
    }
    sql += ' ORDER BY e.apellido, e.nombre';
    const [filas] = await bdd.query(sql, valores);
    return filas;
}

async function obtenerEntrenador(id) {
    const [filas] = await bdd.query(sqlentrenadores + ' AND e.id_entrenador = ?', [id]);
    return filas[0];
}

// Menú de entrenadores
export const entrenadores = (pet, resp) => {
    resp.render('entrenadores');
};

// ALTA
export const altaent = (pet, resp) => {
    resp.render('altaent', { entrenador: {}, error: '' });
};

export const nuevoent = async (pet, resp) => {
    let nom, ape;

    nom = (pet.body.nombre || '').trim();
    ape = (pet.body.apellido || '').trim();

    if (nom === '' || ape === '') {
        return resp.render('altaent', { entrenador: pet.body, error: 'El nombre y el apellido son obligatorios.' });
    }

    try {
        let altasql = 'INSERT INTO ENTRENADOR (nombre, apellido) VALUES (?, ?)';
        const [registro] = await bdd.query(altasql, [nom, ape]);

        resp.redirect('/mostrarent?msg=alta');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        resp.render('altaent', { entrenador: pet.body, error: 'No se pudo guardar el entrenador.' });
    }
};

// BAJA (lógica, activo = 0)
export const bajaent = async (pet, resp) => {
    const apellido = (pet.query.apellido || '').trim();
    const lista = await listarEntrenadores(apellido);
    resp.render('bajaent', { entrenadores: lista, apellido, mensaje: avisos[pet.query.msg] || '', error: '' });
};

export const eliminarent = async (pet, resp) => {
    let id = pet.body.id;
    try {
        let bajasql = 'UPDATE ENTRENADOR SET activo = 0 WHERE id_entrenador = ?';
        await bdd.query(bajasql, [id]);

        resp.redirect('/bajaent?msg=baja');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        const lista = await listarEntrenadores('');
        resp.render('bajaent', { entrenadores: lista, apellido: '', mensaje: '', error: 'No se pudo dar de baja al entrenador.' });
    }
};


export const modent = async (pet, resp) => {
    const id = pet.query.id;
    if (id) {
        const entrenador = await obtenerEntrenador(id);
        if (!entrenador) {
            return resp.redirect('/modent');
        }
        return resp.render('modent', { entrenador, entrenadores: [], apellido: '', error: '' });
    }

    const apellido = (pet.query.apellido || '').trim();
    const lista = await listarEntrenadores(apellido);
    resp.render('modent', { entrenador: null, entrenadores: lista, apellido, error: '' });
};

export const actualizarent = async (pet, resp) => {
    let id, nom, ape;

    id = pet.body.id;
    nom = (pet.body.nombre || '').trim();
    ape = (pet.body.apellido || '').trim();

    const entrenador = { id_entrenador: id, nombre: nom, apellido: ape };

    if (nom === '' || ape === '') {
        return resp.render('modent', { entrenador, entrenadores: [], apellido: '', error: 'El nombre y el apellido son obligatorios.' });
    }

    try {
        let modsql = 'UPDATE ENTRENADOR SET nombre = ?, apellido = ? WHERE id_entrenador = ?';
        await bdd.query(modsql, [nom, ape, id]);

        resp.redirect('/mostrarent?msg=mod');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        resp.render('modent', { entrenador, entrenadores: [], apellido: '', error: 'No se pudo modificar el entrenador.' });
    }
};


export const mostrarent = async (pet, resp) => {
    const lista = await listarEntrenadores('');
    resp.render('mostrarent', { entrenadores: lista, mensaje: avisos[pet.query.msg] || '' });
};


export const consultarent = async (pet, resp) => {
    const apellido = (pet.query.apellido || '').trim();
    let lista = null;
    if (pet.query.apellido !== undefined) {
        lista = await listarEntrenadores(apellido);
    }
    resp.render('consultarent', { entrenadores: lista, apellido });
};
