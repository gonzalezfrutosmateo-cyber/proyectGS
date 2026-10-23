import { conectar } from "../database/conexion.js";
const bd = await conectar();

// 1. Menú
export const menuEntrenadores = (req, res) => {
    res.render('vistasEntrenadores/menuEntrenadores');
};

// 2. Ver
export const listarEntrenadores = async (req, res) => {
    try {
        const [entrenadores] = await bd.query('SELECT * FROM Entrenadores');
        res.render('vistasEntrenadores/verEntrenadores', { entrenadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo (nombre y apellido juntos)
export const buscarEntrenadores = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let entrenadores = [];
        if (buscar) {
            const [resultado] = await bd.query(
                "SELECT * FROM Entrenadores WHERE CONCAT(nombre, ' ', apellido) LIKE ?",
                [`%${buscar}%`]
            );
            entrenadores = resultado;
        }
        res.render('vistasEntrenadores/buscarEntrenadores', { entrenadores, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar entrenadores');
    }
};

// 3. Crear
export const formularioCrear = async (req, res) => {
    try {
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');
        res.render('vistasEntrenadores/crearEntrenadores', { jugadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearEntrenador = async (req, res) => {
    try {
        const { nombre, apellido, id_jugador, fecha_inicio, fecha_fin } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect('/entrenadores/crear?status=error&tipo=datos');
        }
        // Si eligió un jugador: la fecha de inicio es obligatoria y la de fin no puede ser anterior
        if (id_jugador && (!fecha_inicio || (fecha_fin && fecha_fin < fecha_inicio))) {
            return res.redirect('/entrenadores/crear?status=error&tipo=datos');
        }

        const [resEntrenador] = await bd.query('INSERT INTO Entrenadores (nombre, apellido) VALUES (?, ?)', [nombre.trim(), apellido.trim()]);

        // Se usa el id del entrenador recién creado para asignarlo al jugador
        if (id_jugador) {
            await bd.query(
                'INSERT INTO Jugador_Entrenador (id_jugador, id_entrenador, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)',
                [id_jugador, resEntrenador.insertId, fecha_inicio, fecha_fin || null]
            );
        }
        res.redirect('/entrenadores/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/entrenadores/crear?status=error');
    }
};

// 4. Modificar
export const seleccionarModificar = async (req, res) => {
    try {
        const [entrenadores] = await bd.query('SELECT * FROM Entrenadores');
        res.render('vistasEntrenadores/modificarEntrenadores', { entrenadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const id = req.params.id;
        const [entrenador] = await bd.query('SELECT * FROM Entrenadores WHERE id_entrenador = ?', [id]);
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');

        // Entrenamiento que sigue activo (todavía no tiene fecha de fin)
        const [actual] = await bd.query(`
            SELECT je.id_jugador, je.fecha_inicio, j.nombre, j.apellido
            FROM Jugador_Entrenador je
            JOIN Jugadores j ON je.id_jugador = j.id_jugador
            WHERE je.id_entrenador = ? AND je.fecha_fin IS NULL
        `, [id]);

        res.render('vistasEntrenadores/editarEntrenador', { entrenador: entrenador[0], jugadores, actual: actual[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarEntrenador = async (req, res) => {
    let conexion;
    let transaccionIniciada = false;
    try {
        const id = req.params.id;
        const { nombre, apellido, id_jugador, fecha_cambio } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect(`/entrenadores/modificar/${req.params.id}?status=error&tipo=datos`);
        }

        // Jugador que entrena ahora (entrenamiento sin fecha de fin). La fecha se pide como texto AAAA-MM-DD,
        // igual que la que manda el formulario, para poder compararlas
        const [actual] = await bd.query(`
            SELECT id_jugador, DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio
            FROM Jugador_Entrenador
            WHERE id_entrenador = ? AND fecha_fin IS NULL
        `, [id]);
        const jugadorActual = actual.length > 0 ? String(actual[0].id_jugador) : '';
        const jugadorNuevo = id_jugador || '';
        const cambiaJugador = jugadorNuevo !== jugadorActual;

        // Si cambia de jugador (o elige "Ninguno"), la fecha es obligatoria
        // y no puede ser anterior al inicio del entrenamiento actual
        if (cambiaJugador && (!fecha_cambio || (jugadorActual && fecha_cambio < actual[0].fecha_inicio))) {
            return res.redirect(`/entrenadores/modificar/${req.params.id}?status=error&tipo=datos`);
        }

        conexion = await bd.getConnection();
        await conexion.beginTransaction();
        transaccionIniciada = true;

        await conexion.query('UPDATE Entrenadores SET nombre = ?, apellido = ? WHERE id_entrenador = ?', [nombre.trim(), apellido.trim(), id]);

        if (cambiaJugador) {
            // Se finaliza el entrenamiento con el jugador actual
            if (jugadorActual) {
                await conexion.query(
                    'UPDATE Jugador_Entrenador SET fecha_fin = ? WHERE id_entrenador = ? AND id_jugador = ? AND fecha_fin IS NULL',
                    [fecha_cambio, id, jugadorActual]
                );
            }
            // Empieza el entrenamiento con el jugador nuevo
            if (jugadorNuevo) {
                await conexion.query(
                    'INSERT INTO Jugador_Entrenador (id_jugador, id_entrenador, fecha_inicio, fecha_fin) VALUES (?, ?, ?, NULL)',
                    [jugadorNuevo, id, fecha_cambio]
                );
            }
        }

        await conexion.commit();
        transaccionIniciada = false;
        res.redirect('/entrenadores/ver?status=success');
    } catch (error) {
        console.error(error);
        if (transaccionIniciada) {
            try {
                await conexion.rollback();
            } catch (rollbackError) {
                console.error('Error al revertir la edición del entrenador:', rollbackError);
            }
        }
        res.redirect(`/entrenadores/modificar/${req.params.id}?status=error`);
    } finally {
        if (conexion) conexion.release();
    }
};

// 5. Eliminar
export const seleccionarEliminar = async (req, res) => {
    try {
        const [entrenadores] = await bd.query('SELECT * FROM Entrenadores');
        res.render('vistasEntrenadores/eliminarEntrenadores', { entrenadores, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

export const eliminarEntrenador = async (req, res) => {
    try {
        const id = req.params.id;
        await bd.query('DELETE FROM Entrenadores WHERE id_entrenador = ?', [id]);
        res.redirect('/entrenadores/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/entrenadores/eliminar?status=error&tipo=relacion');
    }
};

// 6. CONSULTA 4: Entrenadores de un jugador y fechas
export const verEntrenadoresJugador = async (req, res) => {
    try {
        const idJugador = req.query.id_jugador;

        // Traemos los jugadores para el filtro
        const [jugadores] = await bd.query('SELECT * FROM Jugadores');

        let historial = [];
        if (idJugador) {
            const consulta = `
                SELECT e.nombre, e.apellido, je.fecha_inicio, je.fecha_fin
                FROM Entrenadores e
                JOIN Jugador_Entrenador je ON e.id_entrenador = je.id_entrenador
                WHERE je.id_jugador = ?
            `;
            const [resultado] = await bd.query(consulta, [idJugador]);
            historial = resultado;
        }

        res.render('vistasEntrenadores/entrenadoresJugador', { jugadores, historial, idJugador });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en la consulta');
    }
};