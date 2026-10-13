import { conectar } from '../database/conexion.js';

const bdd = await conectar();

const avisos = {
    alta: 'Árbitro agregado correctamente.',
    baja: 'Árbitro dado de baja correctamente.',
    mod: 'Árbitro modificado correctamente.'
};

// Árbitros activos con la cantidad de partidos que dirigieron
const sqlarbitros = `
    SELECT a.id_arbitro, a.nombre, a.apellido,
        (SELECT COUNT(*) FROM PARTIDO p WHERE p.ARBITRO_id_arbitro = a.id_arbitro) AS partidos
    FROM ARBITRO a
    WHERE a.activo = 1`;

async function listarArbitros(apellido) {
    let sql = sqlarbitros;
    let valores = [];
    if (apellido) {
        sql += ' AND a.apellido LIKE ?';
        valores.push(`%${apellido}%`);
    }
    sql += ' ORDER BY a.apellido, a.nombre';
    const [filas] = await bdd.query(sql, valores);
    return filas;
}

async function obtenerArbitro(id) {
    const [filas] = await bdd.query(sqlarbitros + ' AND a.id_arbitro = ?', [id]);
    return filas[0];
}

// Menú de árbitros
export const arbitros = (pet, resp) => {
    resp.render('arbitros');
};

// ---------- ALTA ----------
export const altaarb = (pet, resp) => {
    resp.render('altaarb', { arbitro: {}, error: '' });
};

export const nuevoarb = async (pet, resp) => {
    let nom, ape;

    nom = (pet.body.nombre || '').trim();
    ape = (pet.body.apellido || '').trim();

    if (nom === '' || ape === '') {
        return resp.render('altaarb', { arbitro: pet.body, error: 'El nombre y el apellido son obligatorios.' });
    }

    try {
        let altasql = 'INSERT INTO ARBITRO (nombre, apellido) VALUES (?, ?)';
        const [registro] = await bdd.query(altasql, [nom, ape]);

        resp.redirect('/mostrararb?msg=alta');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        resp.render('altaarb', { arbitro: pet.body, error: 'No se pudo guardar el árbitro.' });
    }
};

// ---------- BAJA (lógica, activo = 0) ----------
export const bajaarb = async (pet, resp) => {
    const apellido = (pet.query.apellido || '').trim();
    const lista = await listarArbitros(apellido);
    resp.render('bajaarb', { arbitros: lista, apellido, mensaje: avisos[pet.query.msg] || '', error: '' });
};

export const eliminararb = async (pet, resp) => {
    let id = pet.body.id;
    try {
        let bajasql = 'UPDATE ARBITRO SET activo = 0 WHERE id_arbitro = ?';
        await bdd.query(bajasql, [id]);

        resp.redirect('/bajaarb?msg=baja');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        const lista = await listarArbitros('');
        resp.render('bajaarb', { arbitros: lista, apellido: '', mensaje: '', error: 'No se pudo dar de baja al árbitro.' });
    }
};

// ---------- MODIFICACIÓN ----------
export const modarb = async (pet, resp) => {
    const id = pet.query.id;
    if (id) {
        const arbitro = await obtenerArbitro(id);
        if (!arbitro) {
            return resp.redirect('/modarb');
        }
        return resp.render('modarb', { arbitro, arbitros: [], apellido: '', error: '' });
    }

    const apellido = (pet.query.apellido || '').trim();
    const lista = await listarArbitros(apellido);
    resp.render('modarb', { arbitro: null, arbitros: lista, apellido, error: '' });
};

export const actualizararb = async (pet, resp) => {
    let id, nom, ape;

    id = pet.body.id;
    nom = (pet.body.nombre || '').trim();
    ape = (pet.body.apellido || '').trim();

    const arbitro = { id_arbitro: id, nombre: nom, apellido: ape };

    if (nom === '' || ape === '') {
        return resp.render('modarb', { arbitro, arbitros: [], apellido: '', error: 'El nombre y el apellido son obligatorios.' });
    }

    try {
        let modsql = 'UPDATE ARBITRO SET nombre = ?, apellido = ? WHERE id_arbitro = ?';
        await bdd.query(modsql, [nom, ape, id]);

        resp.redirect('/mostrararb?msg=mod');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        resp.render('modarb', { arbitro, arbitros: [], apellido: '', error: 'No se pudo modificar el árbitro.' });
    }
};

// ---------- MOSTRAR TODOS ----------
export const mostrararb = async (pet, resp) => {
    const lista = await listarArbitros('');
    resp.render('mostrararb', { arbitros: lista, mensaje: avisos[pet.query.msg] || '' });
};

// ---------- CONSULTA (buscar por apellido) ----------
export const consultararb = async (pet, resp) => {
    const apellido = (pet.query.apellido || '').trim();
    let lista = null;
    if (pet.query.apellido !== undefined) {
        lista = await listarArbitros(apellido);
    }
    resp.render('consultararb', { arbitros: lista, apellido });
};
