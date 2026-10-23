import mysql from 'mysql2/promise';

export async function conectar() {
    try {
        const bd = await mysql.createPool({
            host: "localhost",
            database: "grand_slam",
            user: "root",
            password: "Puchus25",
        })
        console.log("Base de datos conectado, hola fabio");
        return bd;
    } catch (error) {
        console.log("Error al conectar, mal ahi. . .")
    }
}

// creo que es obvio para que sirve el archivo de conexion pero por las dudas CFFF. Es la conexion de la base de datos con el servidor, en este caso es mysql. Se utiliza la libreria mysql2/promise para poder utilizar promesas y async/await. Se exporta la funcion conectar para poder utilizarla en los controladores. Y bueno lo obvio que es la conexion. Eso si a la hora de abrir el archivo en sus dispositivos modifiquen la constraseña pq si no, no les va a andar. Y descarguen el esquema que les paso en el github we.