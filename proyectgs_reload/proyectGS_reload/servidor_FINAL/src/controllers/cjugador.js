import { conectar } from '../database/conexion.js';

const bdd = await conectar();

const avisos = {
    alta: 'Jugador agregado correctamente.',
    baja: 'Jugador dado de baja correctamente.',
    mod: 'Jugador modificado correctamente.'
};

// Jugadores activos con su nacionalidad, el período en que jugaron y lo que ganaron.
const sqljugadores = `
    SELECT j.id_jugador, j.nombre, j.apellido, j.periodo_activo AS periodo, j.ganancias,
        (SELECT GROUP_CONCAT(pa.nombre SEPARATOR ', ')
            FROM JUGADOR_PAIS jp
            JOIN PAIS pa ON pa.id_pais = jp.PAIS_id_pais
            WHERE jp.JUGADOR_id_jugador = j.id_jugador) AS nacionalidad
    FROM JUGADOR j
    WHERE j.activo = 1`;

async function listarJugadores(apellido) {
    let sql = sqljugadores;
    let valores = [];
    if (apellido) {
        sql += ' AND j.apellido LIKE ?';
        valores.push(`%${apellido}%`);
    }
    sql += ' ORDER BY j.apellido, j.nombre';
    const [filas] = await bdd.query(sql, valores);
    return filas;
}

async function obtenerJugador(id) {
    const [filas] = await bdd.query(sqljugadores + ' AND j.id_jugador = ?', [id]);
    return filas[0];
}

async function listarPaises() {
    const [paises] = await bdd.query('SELECT nombre FROM PAIS ORDER BY nombre');
    return paises;
}

// Guarda la nacionalidad del jugador en JUGADOR_PAIS.
// Si el país no existe en la tabla PAIS se agrega. Si tiene más de una, vienen separadas por coma.
async function guardarNacionalidad(idjug, nacionalidad) {
    await bdd.query('DELETE FROM JUGADOR_PAIS WHERE JUGADOR_id_jugador = ?', [idjug]);

    const nombres = nacionalidad.split(',').map(n => n.trim()).filter(n => n !== '');
    const idspaises = [];

    for (const nombre of nombres) {
        const [filas] = await bdd.query('SELECT id_pais FROM PAIS WHERE nombre = ?', [nombre]);
        let idpais;
        if (filas.length > 0) {
            idpais = filas[0].id_pais;
        } else {
            const [nuevo] = await bdd.query('INSERT INTO PAIS (nombre) VALUES (?)', [nombre]);
            idpais = nuevo.insertId;
        }
        if (!idspaises.includes(idpais)) {
            idspaises.push(idpais);
            await bdd.query('INSERT INTO JUGADOR_PAIS (JUGADOR_id_jugador, PAIS_id_pais) VALUES (?, ?)', [idjug, idpais]);
        }
    }
}

// Revisa los datos obligatorios del jugador. Devuelve el mensaje de error o '' si está todo bien.
// El período es un año o un rango (ej: 2001-2024 o 2003-Presente) y las ganancias entran en un DECIMAL(12,2).
function validarJugador(nom, ape, per, gan) {
    if (nom === '' || ape === '' || per === '' || gan === '') {
        return 'El nombre, el apellido, el período activo y las ganancias son obligatorios.';
    }

    const periodo = per.match(/^(\d{4})(-(\d{4}|Presente))?$/);
    if (!periodo) {
        return 'El período activo tiene que ser un año o un rango, por ejemplo 2001-2024 o 2003-Presente.';
    }
    if (periodo[3] && periodo[3] !== 'Presente' && Number(periodo[3]) < Number(periodo[1])) {
        return 'En el período activo el año de fin no puede ser anterior al de inicio.';
    }

    const ganancias = Number(gan);
    if (isNaN(ganancias) || ganancias < 0 || ganancias > 9999999999.99) {
        return 'Las ganancias tienen que ser un monto entre 0 y 9999999999.99.';
    }
    return '';
}

// Menú de jugadores
export const jugadores = (pet, resp) => {
    resp.render('jugadores');
};

// ALTA
export const altajug = async (pet, resp) => {
    const paises = await listarPaises();
    resp.render('altajug', { paises, jugador: {}, error: '', mensaje: avisos[pet.query.msg] || '' });
};

export const nuevojug = async (pet, resp) => {
    let nom, ape, nac, per, gan;

    nom = (pet.body.nombre || '').trim();
    ape = (pet.body.apellido || '').trim();
    nac = (pet.body.nacionalidad || '').trim();
    per = (pet.body.periodo || '').trim();
    gan = (pet.body.ganancias || '').trim();

    const error = validarJugador(nom, ape, per, gan);
    if (error) {
        const paises = await listarPaises();
        return resp.render('altajug', { paises, jugador: pet.body, error, mensaje: '' });
    }

    try {
        await bdd.beginTransaction();

        let altasql = 'INSERT INTO JUGADOR (nombre, apellido, periodo_activo, ganancias) VALUES (?, ?, ?, ?)';
        const [registro] = await bdd.query(altasql, [nom, ape, per, gan]);
        await guardarNacionalidad(registro.insertId, nac);

        await bdd.commit();
        resp.redirect('/altajug?msg=alta');
    } catch (error) {
        await bdd.rollback();
        console.log("Error en la sentencia:", error);
        const paises = await listarPaises();
        resp.render('altajug', { paises, jugador: pet.body, error: 'No se pudo guardar el jugador.', mensaje: '' });
    }
};

// BAJA
// La baja es lógica: se pone activo = 0 para no perder los partidos que jugó.
export const bajajug = async (pet, resp) => {
    const apellido = (pet.query.apellido || '').trim();
    const lista = await listarJugadores(apellido);
    resp.render('bajajug', { jugadores: lista, apellido, mensaje: avisos[pet.query.msg] || '', error: '' });
};

export const eliminarjug = async (pet, resp) => {
    let id = pet.body.id;
    try {
        let bajasql = 'UPDATE JUGADOR SET activo = 0 WHERE id_jugador = ?';
        await bdd.query(bajasql, [id]);

        resp.redirect('/bajajug?msg=baja');
    } catch (error) {
        console.log("Error en la sentencia:", error);
        const lista = await listarJugadores('');
        resp.render('bajajug', { jugadores: lista, apellido: '', mensaje: '', error: 'No se pudo dar de baja al jugador.' });
    }
};

// MODIFICACIÓN
// Sin id muestra la lista para elegir; con id muestra el formulario con los datos cargados.
export const modjug = async (pet, resp) => {
    const id = pet.query.id;
    if (id) {
        const jugador = await obtenerJugador(id);
        if (!jugador) {
            return resp.redirect('/modjug');
        }
        const paises = await listarPaises();
        return resp.render('modjug', { jugador, jugadores: [], paises, apellido: '', error: '', mensaje: '' });
    }

    const apellido = (pet.query.apellido || '').trim();
    const lista = await listarJugadores(apellido);
    resp.render('modjug', { jugador: null, jugadores: lista, paises: [], apellido, error: '', mensaje: avisos[pet.query.msg] || '' });
};

export const actualizarjug = async (pet, resp) => {
    let id, nom, ape, nac, per, gan;

    id = pet.body.id;
    nom = (pet.body.nombre || '').trim();
    ape = (pet.body.apellido || '').trim();
    nac = (pet.body.nacionalidad || '').trim();
    per = (pet.body.periodo || '').trim();
    gan = (pet.body.ganancias || '').trim();

    const jugador = { id_jugador: id, nombre: nom, apellido: ape, nacionalidad: nac, periodo: per, ganancias: gan };

    const error = validarJugador(nom, ape, per, gan);
    if (error) {
        const paises = await listarPaises();
        return resp.render('modjug', { jugador, jugadores: [], paises, apellido: '', error, mensaje: '' });
    }

    try {
        await bdd.beginTransaction();

        let modsql = 'UPDATE JUGADOR SET nombre = ?, apellido = ?, periodo_activo = ?, ganancias = ? WHERE id_jugador = ?';
        await bdd.query(modsql, [nom, ape, per, gan, id]);
        await guardarNacionalidad(id, nac);

        await bdd.commit();
        resp.redirect('/modjug?msg=mod');
    } catch (error) {
        await bdd.rollback();
        console.log("Error en la sentencia:", error);
        const paises = await listarPaises();
        resp.render('modjug', { jugador, jugadores: [], paises, apellido: '', error: 'No se pudo modificar el jugador.', mensaje: '' });
    }
};

// MOSTRAR TODOS
export const mostrarjug = async (pet, resp) => {
    const lista = await listarJugadores('');
    resp.render('mostrarjug', { jugadores: lista, mensaje: avisos[pet.query.msg] || '' });
};

// CONSULTA
export const consultarjug = async (pet, resp) => {
    const apellido = (pet.query.apellido || '').trim();
    let lista = null;
    if (pet.query.apellido !== undefined) {
        lista = await listarJugadores(apellido);
    }
    resp.render('consultarjug', { jugadores: lista, apellido });
};
