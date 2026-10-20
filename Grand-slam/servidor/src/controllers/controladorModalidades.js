import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuModalidades = (req, res) => res.render('vistasModalidades/menuModalidades');

export const listarModalidades = async (req, res) => {
    try {
        const [modalidades] = await bd.query('SELECT * FROM Modalidades');
        res.render('vistasModalidades/verModalidades', { modalidades, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioCrear = (req, res) => res.render('vistasModalidades/crearModalidades', { status: req.query.status, tipo: req.query.tipo });

export const crearModalidad = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!validarNombre(nombre)) return res.redirect('/modalidades/crear?status=error&tipo=datos');
        await bd.query('INSERT INTO Modalidades (nombre) VALUES (?)', [nombre.trim()]);
        res.redirect('/modalidades/ver?status=success');
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
        const { nombre } = req.body;
        if (!validarNombre(nombre)) return res.redirect(`/modalidades/modificar/${req.params.id}?status=error&tipo=datos`);
        await bd.query('UPDATE Modalidades SET nombre = ? WHERE id_modalidad = ?', [nombre.trim(), req.params.id]);
        res.redirect('/modalidades/ver?status=success');
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

export const eliminarModalidad = async (req, res) => {
    try {
        await bd.query('DELETE FROM Modalidades WHERE id_modalidad = ?', [req.params.id]);
        res.redirect('/modalidades/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/modalidades/eliminar?status=error&tipo=relacion');
    }
};