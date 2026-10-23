import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuModalidades = (req, res) => res.render('vistasModalidades/menuModalidades');

export const listarModalidades = async (req, res) => {
    try {
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');
        res.render('vistasModalidades/verModalidades', { modalidades, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo
export const buscarModalidades = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let modalidades = [];
        if (buscar) {
            const [resultado] = await bd.query('SELECT * FROM Modalidades WHERE nombre LIKE ?', [`%${buscar}%`]);
            modalidades = resultado;
        }
        res.render('vistasModalidades/buscarModalidades', { modalidades, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar modalidades');
    }
};

export const formularioCrear = (req, res) => res.render('vistasModalidades/crearModalidades', { status: req.query.status, tipo: req.query.tipo });

export const crearModalidad = async (req, res) => {
    try {
        const { nombre, jugadores_por_lado } = req.body;
        if (!validarNombre(nombre) || !validarJugadoresPorLado(jugadores_por_lado)) {
            return res.redirect('/modalidades/crear?status=error&tipo=datos');
        }
        await bd.query('INSERT INTO Modalidades (nombre, jugadores_por_lado) VALUES (?, ?)', [nombre.trim(), jugadores_por_lado]);
        res.redirect('/modalidades/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/modalidades/crear?status=error');
    }
};

export const seleccionarModificar = async (req, res) => {
    try {
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');
        res.render('vistasModalidades/modificarModalidades', { modalidades, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [modalidad] = await bd.query('SELECT * FROM Modalidades WHERE id_modalidad = ?', [req.params.id]);
        res.render('vistasModalidades/editarModalidad', { modalidad: modalidad[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarModalidad = async (req, res) => {
    try {
        const { nombre, jugadores_por_lado } = req.body;
        if (!validarNombre(nombre) || !validarJugadoresPorLado(jugadores_por_lado)) {
            return res.redirect(`/modalidades/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        await bd.query('UPDATE Modalidades SET nombre = ?, jugadores_por_lado = ? WHERE id_modalidad = ?', [nombre.trim(), jugadores_por_lado, req.params.id]);
        res.redirect('/modalidades/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/modalidades/modificar/${req.params.id}?status=error`);
    }
};

export const seleccionarEliminar = async (req, res) => {
    try {
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');
        res.render('vistasModalidades/eliminarModalidades', { modalidades, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

// Solo se aceptan 1 (individual, 1 vs 1) o 2 (dobles, 2 vs 2)
function validarJugadoresPorLado(valor) {
    return valor === '1' || valor === '2';
}

export const eliminarModalidad = async (req, res) => {
    try {
        await bd.query('DELETE FROM Modalidades WHERE id_modalidad = ?', [req.params.id]);
        res.redirect('/modalidades/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/modalidades/eliminar?status=error&tipo=relacion');
    }
};
