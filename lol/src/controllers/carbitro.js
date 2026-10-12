import { conectar } from '../database/conexion.js';

export const nuevoarbitro = async (pet, resp) => {
    const { nombre, apellido } = pet.body;
    let altasql = `INSERT INTO ARBITRO (nombre, apellido) VALUES ('${nombre}', '${apellido}')`;
    try {
        const bdd = await conectar();
        const registro = await bdd.query(altasql);
        console.log(`Dato insertado correctamente`);
        resp.redirect('/arbitros.html');
    } catch (error) {
        console.log('Error al insertar el arbitro', error);
    }
};
