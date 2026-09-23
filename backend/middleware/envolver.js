// Express 4 no atrapa los errores de una funcion async: si la promesa falla,
// Node tira "unhandled rejection" y mata el proceso entero. Envolviendo cada
// ruta con esto, el error queda en la consola y la peticion responde 500.
function envolver(handler) {
    return function (req, res, next) {
        handler(req, res, next).catch(function (error) {
            console.error(error);
            res.status(500).json({ error: 'Error del servidor' });
        });
    };
}

module.exports = { envolver };
