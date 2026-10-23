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
            const [resultado] = await bd.query(
                "SELECT * FROM Arbitros WHERE CONCAT(nombre, ' ', apellido) LIKE ?",
                [`%${buscar}%`]
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
        const [arbitros] = await bd.query('SELECT * FROM Arbitros');
        res.render('vistasArbitros/modificarArbitros', { arbitros, status: req.query.status, tipo: req.query.tipo });
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
        const [arbitros] = await bd.query('SELECT * FROM Arbitros');
        res.render('vistasArbitros/eliminarArbitros', { arbitros, status: req.query.status, tipo: req.query.tipo });
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
