import { conectar } from "../database/conexion.js";
const bd = await conectar();

// 1. Menú
export const menuPremios = (req, res) => {
    res.render('vistasPremios/menuPremios');
};

// 2. Ver (Hacemos un JOIN para mostrar el nombre del torneo, no solo el ID)
export const listarPremios = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo_nombre, t.anio AS torneo_anio
            FROM Premios p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
        `;
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/verPremios', { premios, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

// Buscar: solo muestra resultados después de escribir algo (por nombre del torneo o por fase)
export const buscarPremios = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let premios = [];
        if (buscar) {
            const consulta = `
                SELECT p.*, t.nombre AS torneo_nombre, t.anio AS torneo_anio
                FROM Premios p
                JOIN Torneos t ON p.id_torneo = t.id_torneo
                WHERE t.nombre LIKE ? OR p.fase LIKE ?
            `;
            const [resultado] = await bd.query(consulta, [`%${buscar}%`, `%${buscar}%`]);
            premios = resultado;
        }
        res.render('vistasPremios/buscarPremios', { premios, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar premios');
    }
};

// 3. Crear
export const formularioCrear = async (req, res) => {
    try {
        // Traemos los torneos para el select
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        res.render('vistasPremios/crearPremios', { torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearPremio = async (req, res) => {
    try {
        const { id_torneo, fase, monto_ganador, monto_perdedor } = req.body;
        if (!validarId(id_torneo) || !validarFase(fase) || !validarMonto(monto_ganador) || !validarMonto(monto_perdedor)) {
            return res.redirect('/premios/crear?status=error&tipo=datos');
        }
        const consulta = 'INSERT INTO Premios (id_torneo, fase, monto_ganador, monto_perdedor) VALUES (?, ?, ?, ?)';
        await bd.query(consulta, [id_torneo, fase.trim(), monto_ganador, monto_perdedor]);
        res.redirect('/premios/crear?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/premios/crear?status=error');
    }
};

// 4. Modificar
export const seleccionarModificar = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo_nombre 
            FROM Premios p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
        `;
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/modificarPremios', { premios, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const [premio] = await bd.query('SELECT * FROM Premios WHERE id_premio = ?', [req.params.id]);
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        res.render('vistasPremios/editarPremio', { premio: premio[0], torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarPremio = async (req, res) => {
    try {
        const { id_torneo, fase, monto_ganador, monto_perdedor } = req.body;
        if (!validarId(id_torneo) || !validarFase(fase) || !validarMonto(monto_ganador) || !validarMonto(monto_perdedor)) {
            return res.redirect(`/premios/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        const consulta = 'UPDATE Premios SET id_torneo = ?, fase = ?, monto_ganador = ?, monto_perdedor = ? WHERE id_premio = ?';
        await bd.query(consulta, [id_torneo, fase.trim(), monto_ganador, monto_perdedor, req.params.id]);
        res.redirect('/premios/modificar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/premios/modificar/${req.params.id}?status=error`);
    }
};

// 5. Eliminar
export const seleccionarEliminar = async (req, res) => {
    try {
        const consulta = `
            SELECT p.*, t.nombre AS torneo_nombre 
            FROM Premios p
            JOIN Torneos t ON p.id_torneo = t.id_torneo
        `;
        const [premios] = await bd.query(consulta);
        res.render('vistasPremios/eliminarPremios', { premios, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarId(valor) {
    return /^[1-9]\d*$/.test(String(valor || ''));
}

function validarFase(valor) {
    return typeof valor === 'string' && valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ0-9\s.'-]+$/.test(valor.trim());
}

function validarMonto(valor) {
    const monto = Number(valor);
    return /^\d{1,8}(?:\.\d{1,2})?$/.test(String(valor || '')) && Number.isFinite(monto) && monto >= 0;
}

export const eliminarPremio = async (req, res) => {
    try {
        await bd.query('DELETE FROM Premios WHERE id_premio = ?', [req.params.id]);
        res.redirect('/premios/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/premios/eliminar?status=error&tipo=relacion');
    }
};
