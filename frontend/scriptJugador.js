let jugadores = [];
let ultimaBusqueda = '';
let enviandoFormulario = false;

const tbody = document.getElementById('jugadores-tbody');
const overlay = document.getElementById('jugador-modal-overlay');
const modalTitle = document.getElementById('jugador-modal-title');
const form = document.getElementById('form-jugador');
const inputId = document.getElementById('input-jugador-id');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputSexo = document.getElementById('input-sexo');
const inputNacionalidad = document.getElementById('input-nacionalidad');
const inputPeriodoActivo = document.getElementById('input-periodo-activo');
const inputGanancias = document.getElementById('input-ganancias');
const inputBuscarApellido = document.getElementById('input-buscar-apellido');
const btnBuscar = document.getElementById('btn-buscar-jugador');
const btnAgregar = document.getElementById('btn-agregar-jugador');
const thAcciones = document.getElementById('th-acciones');
const btnCancelar = document.getElementById('btn-cancelar-jugador');

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderTabla(lista) {
    const permitido = puedeEscribir('jugadores');

    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="' + (permitido ? 7 : 6) + '">No se encontraron jugadores.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (jugador) {
        const acciones = permitido
            ? '<div class="actions-cell">'
                + '<button type="button" class="btn-edit" data-action="editar" data-id="' + jugador.id + '">Modificar</button>'
                + '<button type="button" class="btn-delete" data-action="eliminar" data-id="' + jugador.id + '">Eliminar</button>'
                + '</div>'
            : '';

        return '<tr>'
            + '<td>' + escapeHtml(jugador.nombre) + '</td>'
            + '<td>' + escapeHtml(jugador.apellido) + '</td>'
            + '<td>' + escapeHtml(jugador.sexo === 'F' ? 'Femenino' : 'Masculino') + '</td>'
            + '<td>' + escapeHtml(jugador.nacionalidad || '-') + '</td>'
            + '<td>' + escapeHtml(jugador.periodoActivo || '-') + '</td>'
            + '<td>' + escapeHtml(jugador.ganancias || '-') + '</td>'
            + (permitido ? '<td>' + acciones + '</td>' : '')
            + '</tr>';
    }).join('');
}

function listaFiltrada() {
    if (!ultimaBusqueda) {
        return jugadores;
    }
    const consulta = ultimaBusqueda.toLowerCase();
    return jugadores.filter(function (jugador) {
        return jugador.apellido.toLowerCase().includes(consulta);
    });
}

function renderConFiltroActual() {
    renderTabla(listaFiltrada());
}

function aplicarPermisosUI() {
    btnAgregar.hidden = !puedeEscribir('jugadores');
    thAcciones.hidden = !puedeEscribir('jugadores');
    renderConFiltroActual();
}

async function cargarJugadores() {
    try {
        const respuesta = await fetch('/api/jugadores');
        jugadores = respuesta.ok ? await respuesta.json() : [];
        renderConFiltroActual();
    } catch (error) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="7">No se pudo conectar con el servidor. Entrá por http://localhost:3000/ con el backend corriendo (npm start).</td></tr>';
    }
}

function abrirModalAgregar() {
    if (!puedeEscribir('jugadores')) {
        return;
    }
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Agregar Jugador';
    overlay.hidden = false;
    inputNombre.focus();
}

function abrirModalEditar(id) {
    if (!puedeEscribir('jugadores')) {
        return;
    }
    const jugador = jugadores.find(function (j) { return j.id === id; });
    if (!jugador) {
        return;
    }
    inputId.value = jugador.id;
    inputNombre.value = jugador.nombre;
    inputApellido.value = jugador.apellido;
    inputSexo.value = jugador.sexo;
    inputNacionalidad.value = jugador.nacionalidad || '';
    inputPeriodoActivo.value = jugador.periodoActivo || '';
    inputGanancias.value = jugador.ganancias || '';
    modalTitle.textContent = 'Modificar Jugador';
    overlay.hidden = false;
    inputNombre.focus();
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
    inputId.value = '';
}

async function eliminarJugador(id) {
    if (!puedeEscribir('jugadores')) {
        return;
    }
    const jugador = jugadores.find(function (j) { return j.id === id; });
    if (!jugador) {
        return;
    }
    const confirmado = confirm('¿Seguro que deseas eliminar a ' + jugador.nombre + ' ' + jugador.apellido + '?');
    if (!confirmado) {
        return;
    }
    const respuesta = await fetch('/api/jugadores/' + id, { method: 'DELETE' });
    if (!respuesta.ok) {
        alert('No se pudo eliminar el jugador.');
        return;
    }
    await cargarJugadores();
    alert('Jugador eliminado correctamente.');
}

tbody.addEventListener('click', function (evento) {
    const boton = evento.target.closest('button[data-action]');
    if (!boton) {
        return;
    }
    const id = Number(boton.dataset.id);
    if (boton.dataset.action === 'editar') {
        abrirModalEditar(id);
    } else if (boton.dataset.action === 'eliminar') {
        eliminarJugador(id);
    }
});

btnBuscar.addEventListener('click', function () {
    ultimaBusqueda = inputBuscarApellido.value.trim();
    renderConFiltroActual();
});

btnAgregar.addEventListener('click', abrirModalAgregar);
btnCancelar.addEventListener('click', cerrarModal);

inputGanancias.addEventListener('input', function () {
    inputGanancias.value = inputGanancias.value.replace(/\D/g, '');
});

overlay.addEventListener('click', function (evento) {
    if (evento.target === overlay) {
        cerrarModal();
    }
});

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !overlay.hidden) {
        cerrarModal();
    }
});

document.addEventListener('rolCambiado', aplicarPermisosUI);

form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (enviandoFormulario || !puedeEscribir('jugadores')) {
        return;
    }
    enviandoFormulario = true;

    const datos = {
        nombre: inputNombre.value.trim(),
        apellido: inputApellido.value.trim(),
        sexo: inputSexo.value,
        nacionalidad: inputNacionalidad.value.trim(),
        periodoActivo: inputPeriodoActivo.value.trim(),
        ganancias: inputGanancias.value.replace(/\D/g, ''),
    };

    if (!datos.nombre || !datos.apellido || !datos.sexo || !datos.nacionalidad) {
        enviandoFormulario = false;
        return;
    }

    const idEditado = inputId.value ? Number(inputId.value) : null;
    const url = idEditado !== null ? '/api/jugadores/' + idEditado : '/api/jugadores';
    const metodo = idEditado !== null ? 'PUT' : 'POST';

    const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        alert('No se pudo guardar el jugador.');
        enviandoFormulario = false;
        return;
    }

    await cargarJugadores();
    cerrarModal();
    enviandoFormulario = false;
});

aplicarPermisosUI();
cargarJugadores();
