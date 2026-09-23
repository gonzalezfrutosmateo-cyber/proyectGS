const MODALIDADES = [
    { valor: 'individual-masculino', label: 'Individual Masculino' },
    { valor: 'individual-femenino', label: 'Individual Femenino' },
    { valor: 'dobles-masculino', label: 'Dobles Masculino' },
    { valor: 'dobles-femenino', label: 'Dobles Femenino' },
    { valor: 'dobles-mixto', label: 'Dobles Mixto' },
];

let ediciones = [];

const tbody = document.getElementById('torneos-tbody');
const filtroAnio = document.getElementById('filtro-anio');
const filtroTorneo = document.getElementById('filtro-torneo');
const btnBuscar = document.getElementById('btn-buscar-torneo');

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatearDinero(monto) {
    if (monto == null) {
        return '-';
    }
    return 'USD ' + Number(monto).toLocaleString('es-AR');
}

function mensajeTabla(texto) {
    tbody.innerHTML = '<tr class="no-results"><td colspan="4">' + texto + '</td></tr>';
}

async function cargarEdiciones() {
    try {
        const respuesta = await fetch('/api/ediciones');
        ediciones = respuesta.ok ? await respuesta.json() : [];
    } catch (error) {
        mensajeTabla('No se pudo conectar con el servidor. Entrá por http://localhost:3000/ con el backend corriendo (npm start).');
        return;
    }

    const anios = [...new Set(ediciones.map(function (e) { return e.anio; }))].sort(function (a, b) { return b - a; });
    const torneos = [...new Set(ediciones.map(function (e) { return e.torneo; }))].sort();

    filtroAnio.innerHTML = '<option value="">Seleccionar año...</option>'
        + anios.map(function (a) { return '<option value="' + a + '">' + a + '</option>'; }).join('');
    filtroTorneo.innerHTML = '<option value="">Seleccionar torneo...</option>'
        + torneos.map(function (t) { return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>'; }).join('');

    mensajeTabla('Elegí un año y un torneo para ver los resultados.');
}

function renderResumen(resumen) {
    tbody.innerHTML = MODALIDADES.map(function (modalidad) {
        const fila = resumen.find(function (r) { return r.modalidad === modalidad.valor; });
        return '<tr>'
            + '<td>' + modalidad.label + '</td>'
            + '<td>' + escapeHtml(fila && fila.campeon ? fila.campeon : '-') + '</td>'
            + '<td>' + escapeHtml(fila && fila.finalista ? fila.finalista : '-') + '</td>'
            + '<td>' + escapeHtml(formatearDinero(fila ? fila.dineroRepartido : null)) + '</td>'
            + '</tr>';
    }).join('');
}

async function buscar() {
    const anio = filtroAnio.value;
    const torneo = filtroTorneo.value;

    if (!anio || !torneo) {
        mensajeTabla('Elegí un año y un torneo para ver los resultados.');
        return;
    }

    const edicion = ediciones.find(function (e) {
        return String(e.anio) === anio && e.torneo === torneo;
    });

    if (!edicion) {
        mensajeTabla('No hay una edición cargada de ' + escapeHtml(torneo) + ' ' + escapeHtml(anio) + '.');
        return;
    }

    try {
        const respuesta = await fetch('/api/torneos/' + edicion.id + '/resumen');
        if (!respuesta.ok) {
            mensajeTabla('No se pudo traer el resumen del torneo.');
            return;
        }
        renderResumen(await respuesta.json());
    } catch (error) {
        mensajeTabla('No se pudo conectar con el servidor.');
    }
}

btnBuscar.addEventListener('click', buscar);

cargarEdiciones();
