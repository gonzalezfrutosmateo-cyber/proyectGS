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

// 3. Crear
export const formularioCrear = (req, res) => {
    res.render('vistasEntrenadores/crearEntrenadores', { status: req.query.status, tipo: req.query.tipo });
};

export const crearEntrenador = async (req, res) => {
    try {
        const { nombre, apellido } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect('/entrenadores/crear?status=error&tipo=datos');
        }
        await bd.query('INSERT INTO Entrenadores (nombre, apellido) VALUES (?, ?)', [nombre.trim(), apellido.trim()]);
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
        res.render('vistasEntrenadores/editarEntrenador', { entrenador: entrenador[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarEntrenador = async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, apellido } = req.body;
        if (!validarNombre(nombre) || !validarNombre(apellido)) {
            return res.redirect(`/entrenadores/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        await bd.query('UPDATE Entrenadores SET nombre = ?, apellido = ? WHERE id_entrenador = ?', [nombre.trim(), apellido.trim(), id]);
        res.redirect('/entrenadores/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/entrenadores/modificar/${req.params.id}?status=error`);
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