import { conectar } from "../database/conexion.js";
const bd = await conectar();

// 1. Menú de Torneos
export const menuTorneos = (req, res) => {
    res.render('vistasTorneos/menuTorneos');
};

// 2. Ver Torneos
export const listarTorneos = async (req, res) => {
    try {
        const consulta = `
            SELECT t.*, s.nombre as sede_nombre, p.nombre as pais_nombre 
            FROM Torneos t
            LEFT JOIN Sedes s ON t.id_sede = s.id_sede
            LEFT JOIN Paises p ON s.id_pais = p.id_pais
        `;
        const [torneos] = await bd.query(consulta);
        res.render('vistasTorneos/verTorneos', { torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error al listar torneos'); }
};

// Buscar: solo muestra resultados después de escribir algo (por nombre, año, sede o país)
export const buscarTorneos = async (req, res) => {
    try {
        const buscar = req.query.buscar || '';
        let torneos = [];
        if (buscar) {
            const consulta = `
                SELECT t.*, s.nombre as sede_nombre, p.nombre as pais_nombre
                FROM Torneos t
                LEFT JOIN Sedes s ON t.id_sede = s.id_sede
                LEFT JOIN Paises p ON s.id_pais = p.id_pais
                WHERE t.nombre LIKE ? OR t.anio LIKE ? OR s.nombre LIKE ? OR p.nombre LIKE ?
            `;
            const texto = `%${buscar}%`;
            const [resultado] = await bd.query(consulta, [texto, texto, texto, texto]);
            torneos = resultado;
        }
        res.render('vistasTorneos/buscarTorneos', { torneos, buscar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar torneos');
    }
};

// Crear Torneo 
export const formularioCrear = async (req, res) => {
    try {
        const [sedes] = await bd.query('SELECT * FROM Sedes');
        res.render('vistasTorneos/crearTorneos', { sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const crearTorneo = async (req, res) => {
    try {
        const { nombre, anio, id_sede } = req.body;
        if (!validarNombre(nombre) || !validarAnio(anio) || !validarId(id_sede)) {
            return res.redirect('/torneos/crear?status=error&tipo=datos');
        }
        await bd.query('INSERT INTO Torneos (nombre, anio, id_sede) VALUES (?, ?, ?)', [nombre.trim(), anio, id_sede]);
        res.redirect('/torneos/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/torneos/crear?status=error');
    }
};

// Modificar Torneo
export const seleccionarModificar = async (req, res) => {
    try {
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        res.render('vistasTorneos/modificarTorneos', { torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const formularioEditar = async (req, res) => {
    try {
        const id = req.params.id;
        const [torneo] = await bd.query('SELECT * FROM Torneos WHERE id_torneo = ?', [id]);
        const [sedes] = await bd.query('SELECT * FROM Sedes');
        res.render('vistasTorneos/editarTorneo', { torneo: torneo[0], sedes, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

export const editarTorneo = async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, anio, id_sede } = req.body;
        if (!validarNombre(nombre) || !validarAnio(anio) || !validarId(id_sede)) {
            return res.redirect(`/torneos/modificar/${req.params.id}?status=error&tipo=datos`);
        }
        await bd.query('UPDATE Torneos SET nombre = ?, anio = ?, id_sede = ? WHERE id_torneo = ?', [nombre.trim(), anio, id_sede, id]);
        res.redirect('/torneos/ver?status=success');
    } catch (error) {
        console.error(error);
        res.redirect(`/torneos/modificar/${req.params.id}?status=error`);
    }
};

// Eliminar Torneo
export const seleccionarEliminar = async (req, res) => {
    try {
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        res.render('vistasTorneos/eliminarTorneos', { torneos, status: req.query.status, tipo: req.query.tipo });
    } catch (error) { res.status(500).send('Error'); }
};

function validarNombre(valor) {
    return typeof valor === 'string' &&
        valor.trim().length <= 50 &&
        /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/.test(valor.trim());
}

function validarAnio(valor) {
    const anio = Number(valor);
    return /^\d{4}$/.test(String(valor)) && anio >= 1877 && anio <= new Date().getFullYear();
}

function validarId(valor) {
    return /^[1-9]\d*$/.test(String(valor || ''));
}

export const eliminarTorneo = async (req, res) => {
    try {
        const id = req.params.id;
        await bd.query('DELETE FROM Torneos WHERE id_torneo = ?', [id]);
        res.redirect('/torneos/eliminar?status=success');
    } catch (error) {
        console.error(error);
        res.redirect('/torneos/eliminar?status=error&tipo=relacion');
    }
};

// Composición y resultados
export const verResultados = async (req, res) => {
    try {
        const { anio, id_torneo } = req.query; 
        
        // Si no mandaron filtros, mostramos la pantalla en blanco
        if (!anio || !id_torneo) {
            const [torneos] = await bd.query('SELECT * FROM Torneos');
            return res.render('vistasTorneos/resultadosTorneo', { torneos, resultados: [] });
        }

        // Usamos GROUP_CONCAT para juntar los jugadores de un partido en un solo string
        const consulta = `
            SELECT part.fase, part.resultado, m.nombre as modalidad, 
                   CONCAT(a.nombre, ' ', a.apellido) as arbitro,
                   GROUP_CONCAT(DISTINCT CONCAT(j.nombre, ' ', j.apellido) SEPARATOR ' / ') as jugadores
            FROM Partidos part
            JOIN Torneos t ON part.id_torneo = t.id_torneo
            JOIN Modalidades m ON part.id_modalidad = m.id_modalidad
            JOIN Arbitros a ON part.id_arbitro = a.id_arbitro
            JOIN Participaciones_Partidos pp ON part.id_partido = pp.id_partido
            JOIN Jugadores j ON pp.id_jugador = j.id_jugador
            WHERE t.anio = ? AND t.id_torneo = ?
            GROUP BY part.id_partido, part.fase, part.resultado, m.nombre, a.nombre, a.apellido
        `;
        
        const [resultados] = await bd.query(consulta, [anio, id_torneo]);
        const [torneos] = await bd.query('SELECT * FROM Torneos');
        
        res.render('vistasTorneos/resultadosTorneo', { resultados, torneos, anio, id_torneo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al buscar resultados');
    }
};

// mateo, nacho polfavor cuiden el codigo y no le metan claude ni gpt. . . y lean lo q anoto aca tio:

// group_concat es una funcion de mysql que permite concatenar valores de una columna en un solo string, separados por un delimitador. En este caso, se usa para juntar los nombres de los jugadores de un partido en un solo string, separados por " / ". Esto es útil para mostrar todos los jugadores de un partido en una sola fila de resultados.
// Por ultimo "join" es una palabra clave de SQL que permite combinar filas de dos o más tablas basadas en una columna relacionada entre ellas. En este caso, se usa para unir las tablas Partidos, Torneos, Modalidades, Arbitros, Participaciones_Partidos y Jugadores para obtener toda la información necesaria para mostrar los resultados de un torneo.

//Para detallar algo mas. Para que sirve los controladore? Bueno estos sirven para manejar la logica de negocio de la aplicacion. Es decir, reciben las peticiones del usuario, procesan los datos y devuelven una respuesta. En este caso, los controladores de torneos manejan las operaciones CRUD (crear, leer, actualizar y eliminar) de los torneos, asi como la consulta de resultados. Los controladores se comunican con la base de datos a traves del archivo de conexion y utilizan las vistas para mostrar la informacion al usuario.