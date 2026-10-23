import { conectar } from "../database/conexion.js";
const bd = await conectar();

export const menuSedes = (req, res) => res.render('vistasSedes/menuSedes');

export const listarSedes = async (req, res) => {
    try {
        const consulta = `
            SELECT s.id_sede, s.nombre, p.nombre AS pais
            FROM Sedes s
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
        `;
        const [sedes] = await bd.query(consulta);
        res.render('vistasSedes/verSedes', { sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo (por nombre de la sede o del país)
export const buscarSedes = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let sedes = [];
        if (buscar) {
            const consulta = `
                SELECT s.id_sede, s.nombre, p.nombre AS pais
                FROM Sedes s
                LEFT JOIN Paises p ON s.id_pais = p.id_pais
                WHERE s.nombre LIKE ? OR p.nombre LIKE ?
            `;
            const [resultado] = await bd.query(consulta, [`%${buscar}%`, `%${buscar}%`]);
            sedes = resultado;
        }
        res.render('vistasSedes/buscarSedes', { sedes, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar sedes');
    }
};

export const formularioCrear = async (req, res) => {
    try {
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasSedes/crearSedes', { paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearSede = async (req, res) => {
    try {
        const { nombre, id_pais } = req.body;
        if (!validarNombre(nombre) || !validarId(id_pais)) return res.redirect('/sedes/crear?status=error&tipo=datos');
        await bd.query('INSERT INTO Sedes (nombre, id_pais) VALUES (?, ?)', [nombre.trim(), id_pais]);
        res.redirect('/sedes/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/sedes/crear?status=error');
    }
};

export const seleccionarModificar = async (req, res) => {
    try {
        const [sedes] = await bd.query('SELECT * FROM Sedes');
        res.render('vistasSedes/modificarSedes', { sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [sede] = await bd.query('SELECT * FROM Sedes WHERE id_sede = ?', [req.params.id]);
        const [paises] = await bd.query('SELECT * FROM Paises');
        res.render('vistasSedes/editarSede', { sede: sede[0], paises, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarSede = async (req, res) => {
    try {
        const { nombre, id_pais } = req.body;
        if (!validarNombre(nombre) || !validarId(id_pais)) return res.redirect(`/sedes/modificar/${req.params.id}?status=error&tipo=datos`);
        await bd.query('UPDATE Sedes SET nombre = ?, id_pais = ? WHERE id_sede = ?', [nombre.trim(), id_pais, req.params.id]);
        res.redirect('/sedes/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/sedes/modificar/${req.params.id}?status=error`);
    }
};

export const seleccionarEliminar = async (req, res) => {
    try {
        const [sedes] = await bd.query('SELECT * FROM Sedes');
        res.render('vistasSedes/eliminarSedes', { sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

function validarId(valor) {
    return /^[1-9]\d*$/.test(String(valor || ''));
}

export const eliminarSede = async (req, res) => {
    try {
        await bd.query('DELETE FROM Sedes WHERE id_sede = ?', [req.params.id]);
        res.redirect('/sedes/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/sedes/eliminar?status=error&tipo=relacion');
    }
};
