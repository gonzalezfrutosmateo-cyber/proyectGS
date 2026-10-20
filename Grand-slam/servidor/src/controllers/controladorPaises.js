import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuPaises = (req, res) => res.render('vistasPaises/menuPaises');

export const listarPaises = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasPaises/verPaises', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioCrear = (req, res) => res.render('vistasPaises/crearPaises', { status: req.query.status, tipo: req.query.tipo });

export const crearPais = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!validarNombre(nombre)) return res.redirect('/paises/crear?status=error&tipo=datos');
        await bd.query('INSERT INTO Paises (nombre) VALUES (?)', [nombre.trim()]);
        res.redirect('/paises/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/paises/crear?status=error');
    }
};

export const seleccionarModificar = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasPaises/modificarPaises', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [pais] = await bd.query('SELECT * FROM Paises WHERE id_pais = ?', [req.params.id]);
        res.render('vistasPaises/editarPais', { pais: pais[0], status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarPais = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!validarNombre(nombre)) return res.redirect(`/paises/modificar/${req.params.id}?status=error&tipo=datos`);
        await bd.query('UPDATE Paises SET nombre = ? WHERE id_pais = ?', [nombre.trim(), req.params.id]);
        res.redirect('/paises/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/paises/modificar/${req.params.id}?status=error`);
    }
};

export const seleccionarEliminar = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasPaises/eliminarPaises', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

export const eliminarPais = async (req, res) => {
    try {
        await bd.query('DELETE FROM Paises WHERE id_pais = ?', [req.params.id]);
        res.redirect('/paises/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/paises/eliminar?status=error&tipo=relacion');
    }
};