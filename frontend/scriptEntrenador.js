let entrenadores = [];
let ultimaBusqueda = '';
let enviandoFormulario = false;

const tbody = document.getElementById('entrenadores-tbody');
const overlay = document.getElementById('entrenador-modal-overlay');
const modalTitle = document.getElementById('entrenador-modal-title');
const form = document.getElementById('form-entrenador');
const inputId = document.getElementById('input-entrenador-id');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputBuscarApellido = document.getElementById('input-buscar-apellido');
const btnBuscar = document.getElementById('btn-buscar-entrenador');
const btnAgregar = document.getElementById('btn-agregar-entrenador');
const thAcciones = document.getElementById('th-acciones');
const btnCancelar = document.getElementById('btn-cancelar-entrenador');

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderTabla(lista) {
    const permitido = puedeEscribir('entrenadores');

    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="' + (permitido ? 3 : 2) + '">No se encontraron entrenadores.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (entrenador) {
        const acciones = permitido
            ? '<div class="actions-cell">'
                + '<button type="button" class="btn-edit" data-action="editar" data-id="' + entrenador.id + '">Modificar</button>'
                + '<button type="button" class="btn-delete" data-action="eliminar" data-id="' + entrenador.id + '">Eliminar</button>'
                + '</div>'
            : '';

        return '<tr>'
            + '<td>' + escapeHtml(entrenador.nombre) + '</td>'
            + '<td>' + escapeHtml(entrenador.apellido) + '</td>'
            + (permitido ? '<td>' + acciones + '</td>' : '')
            + '</tr>';
    }).join('');
}

function listaFiltrada() {
    if (!ultimaBusqueda) {
        return entrenadores;
    }
    const consulta = ultimaBusqueda.toLowerCase();
    return entrenadores.filter(function (entrenador) {
        return entrenador.apellido.toLowerCase().includes(consulta);
    });
}

function renderConFiltroActual() {
    renderTabla(listaFiltrada());
}

function aplicarPermisosUI() {
    btnAgregar.hidden = !puedeEscribir('entrenadores');
    thAcciones.hidden = !puedeEscribir('entrenadores');
    renderConFiltroActual();
}

async function cargarEntrenadores() {
    try {
        const respuesta = await fetch('/api/entrenadores');
        entrenadores = respuesta.ok ? await respuesta.json() : [];
        renderConFiltroActual();
    } catch (error) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="3">No se pudo conectar con el servidor. Entrá por http://localhost:3000/ con el backend corriendo (npm start).</td></tr>';
    }
}

function abrirModalAgregar() {
    if (!puedeEscribir('entrenadores')) {
        return;
    }
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Agregar Entrenador';
    overlay.hidden = false;
    inputNombre.focus();
}

function abrirModalEditar(id) {
    if (!puedeEscribir('entrenadores')) {
        return;
    }
    const entrenador = entrenadores.find(function (e) { return e.id === id; });
    if (!entrenador) {
        return;
    }
    inputId.value = entrenador.id;
    inputNombre.value = entrenador.nombre;
    inputApellido.value = entrenador.apellido;
    modalTitle.textContent = 'Modificar Entrenador';
    overlay.hidden = false;
    inputNombre.focus();
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
    inputId.value = '';
}

async function eliminarEntrenador(id) {
    if (!puedeEscribir('entrenadores')) {
        return;
    }
    const entrenador = entrenadores.find(function (e) { return e.id === id; });
    if (!entrenador) {
        return;
    }
    const confirmado = confirm('¿Seguro que deseas eliminar a ' + entrenador.nombre + ' ' + entrenador.apellido + '?');
    if (!confirmado) {
        return;
    }
    const respuesta = await fetch('/api/entrenadores/' + id, { method: 'DELETE' });
    if (!respuesta.ok) {
        alert('No se pudo eliminar el entrenador.');
        return;
    }
    await cargarEntrenadores();
    alert('Entrenador eliminado correctamente.');
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
        eliminarEntrenador(id);
    }
});

btnBuscar.addEventListener('click', function () {
    ultimaBusqueda = inputBuscarApellido.value.trim();
    renderConFiltroActual();
});

btnAgregar.addEventListener('click', abrirModalAgregar);
btnCancelar.addEventListener('click', cerrarModal);

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
    if (enviandoFormulario || !puedeEscribir('entrenadores')) {
        return;
    }
    enviandoFormulario = true;

    const datos = {
        nombre: inputNombre.value.trim(),
        apellido: inputApellido.value.trim(),
    };

    if (!datos.nombre || !datos.apellido) {
        enviandoFormulario = false;
        return;
    }

    const idEditado = inputId.value ? Number(inputId.value) : null;
    const url = idEditado !== null ? '/api/entrenadores/' + idEditado : '/api/entrenadores';
    const metodo = idEditado !== null ? 'PUT' : 'POST';

    const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        alert('No se pudo guardar el entrenador.');
        enviandoFormulario = false;
        return;
    }

    await cargarEntrenadores();
    cerrarModal();
    enviandoFormulario = false;
});

aplicarPermisosUI();
cargarEntrenadores();
