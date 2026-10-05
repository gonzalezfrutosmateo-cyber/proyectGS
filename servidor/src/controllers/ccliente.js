import { conectar } from '../database/conexion.js';

export const clientes = (pet, resp) => {
    resp.render('clientes');
};

export const altacli = (pet, resp) => {
    resp.render('altacli');
};

export const bajacli = (pet, resp) => {
    resp.render('bajacli');
};

export const modcli = (pet, resp) => {
    resp.render('modcli');
};

export const mostrarcli = (pet, resp) => {
    resp.render('mostrarcli');
};

export const consultarcli = (pet, resp) => {
    resp.render('consultarcli');
};

export const nuevocli = async (pet, resp) => {
    const { idclientes, nombre, direccion, telefono, ciudad } = pet.body;
    let altasql = `INSERT INTO clientes (idclientes, nombre, direccion, telefono, ciudad) VALUES ('${idclientes}', '${nombre}', '${direccion}', '${telefono}', '${ciudad}')`;
    try {
        const bdd = await conectar();
        const registro = await bdd.query(altasql);
        console.log(`Dato insertado correctamente`);
        resp.redirect('/clientes');
    } catch (error) {
        console.log('Error al insertar el cliente', error);
    }
};

