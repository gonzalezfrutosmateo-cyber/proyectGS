document.addEventListener('DOMContentLoaded', () => {
    const tabla = document.getElementById('tablaVerJugadores');

    // Cargar jugadores al cargar la página. Usando fetch para hacer una solicitud al servidor y obtener los datos de los jugadores en formato JSON. Luego, se recorre el array de jugadores y se crean filas en la tabla con sus datos.

    //Por las dudas. . . Un fetch permite hacer solicitudes HTTP asincrónicas a un servidor y obtener datos en formato JSON. En este caso, se utiliza para cargar los jugadores desde el servidor y mostrarlos en una tabla en la página web. Se hace una solicitud GET a la ruta '/jugadores/verTablaJugadores', y si la respuesta es exitosa, se procesan los datos y se crean filas en la tabla con la información de cada jugador. Si ocurre un error, se muestra un mensaje en la consola y se indica que no se pudieron cargar los jugadores.
    if (tabla) {
        fetch('/jugadores/verTablaJugadores')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(jugadores => {
                tabla.innerHTML = '';
                if (jugadores.length === 0) {
                    const fila = document.createElement('tr');
                    const celda = document.createElement('td');
                    celda.colSpan = 4;
                    celda.textContent = 'No hay jugadores cargados.';
                    fila.appendChild(celda);
                    tabla.appendChild(fila);
                    return;
                }

                jugadores.forEach(jugador => {
                    const fila = document.createElement('tr');
                    const id = document.createElement('td');
                    const nombre = document.createElement('td');
                    const apellido = document.createElement('td');
                    const reporte = document.createElement('td');
                    const enlace = document.createElement('a');

                    id.textContent = jugador.id_jugador;
                    nombre.textContent = jugador.nombre;
                    apellido.textContent = jugador.apellido;
                    enlace.href = `/jugadores/ganancias/${encodeURIComponent(jugador.id_jugador)}?nombre=${encodeURIComponent(jugador.nombre)}`;
                    enlace.textContent = 'Ver Ganancias';
                    reporte.appendChild(enlace);
                    fila.append(id, nombre, apellido, reporte);
                    tabla.appendChild(fila);
                });
            })
            .catch(error => {
                console.error('Hubo un problema al cargar los jugadores:', error);
                tabla.innerHTML = '';
                const fila = document.createElement('tr');
                const celda = document.createElement('td');
                celda.colSpan = 4;
                celda.textContent = 'No se pudieron cargar los jugadores.';
                fila.appendChild(celda);
                tabla.appendChild(fila);
            });
    }

    document.querySelectorAll('form').forEach(formulario => {
        if (formulario.method === 'get' || !formulario.querySelector('input, select, textarea')) return;

        // Desactivar la validación nativa del navegador
        formulario.noValidate = true;
        formulario.addEventListener('submit', evento => {
            let mensaje = '';
            const patronNombre = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ][A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ\s.'-]*$/; //esta const es para validar nombres y apellidos, permitiendo letras, acentos, espacios y algunos caracteres especiales como puntos y guiones. Se asegura de que el nombre o apellido comience con una letra y no contenga números ni otros caracteres no permitidos.
            const patronFase = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ0-9\s.'-]+$/; //lo mismo aca 
            const patronResultado = /^[0-9]+-[0-9]+(?:[\s/]+[0-9]+-[0-9]+)*$/; //y aca para validar el resultado de un partido, permitiendo el formato "6-3 4-6 7-5" o "6-3/4-6/7-5", asegurando que solo se ingresen números y guiones en el formato correcto. Aun me falta arreglar algunas cosas sobre las tandas de desempate y los resultados de dobles, tema de que no toma correctamente la cantidad de partidos ganados y perdidas, pero por ahora esto es lo que hay. Tengo miedo.
           
            // Validación de campos
            for (const campo of formulario.elements) {
                if (!campo.name) continue;
                const valor = campo.value.trim();

                if (campo.required && !valor) {
                    mensaje = 'Completa todos los campos obligatorios.';
                    break;
                }
                if (['nombre', 'apellido'].includes(campo.name) &&
                    (!valor || valor.length > 50 || !patronNombre.test(valor))) {
                    mensaje = 'Los nombres y apellidos deben contener solo letras.';
                    break;
                }
                if (campo.name === 'fase' && (!valor || valor.length > 50 || !patronFase.test(valor))) {
                    mensaje = 'Ingresa una fase válida.';
                    break;
                }
                if (campo.name === 'resultado' && (!valor || valor.length > 50 || !patronResultado.test(valor))) {
                    mensaje = 'Escribe el resultado con el formato 6-3 4-6 7-5.';
                    break;
                }
                if (campo.name === 'anio' &&
                    (!/^\d{4}$/.test(valor) || Number(valor) < 1877 || Number(valor) > new Date().getFullYear())) {
                    mensaje = 'Ingresa un año válido entre 1877 y el año actual.';
                    break;
                }
                if (['monto_ganador', 'monto_perdedor'].includes(campo.name) &&
                    (!/^\d{1,8}(?:\.\d{1,2})?$/.test(valor) || Number(valor) < 0)) {
                    mensaje = 'Ingresa un monto válido, sin negativos y con hasta dos decimales.';
                    break;
                }
                if (!campo.checkValidity()) {
                    mensaje = 'Revisa los datos ingresados e inténtalo de nuevo.';
                    break;
                }
            }

            if (mensaje) {
                evento.preventDefault();
                Swal.fire({ icon: 'error', title: 'Datos inválidos', text: mensaje });
            }
        });
    });
});

// Nuestro "script.js" ejecuta en el navegador del cliente y se encarga de manejar la interacción con la interfaz de usuario. En este caso, se encarga de cargar los jugadores desde el servidor y mostrarlos en una tabla, así como de validar los formularios antes de enviarlos al servidor. Utiliza la librería SweetAlert2 para mostrar mensajes emergentes de manera más atractiva y personalizable.