let arbitros = [];
let ultimaBusqueda = '';
let enviandoFormulario = false;

const tbody = document.getElementById('arbitros-tbody');
const overlay = document.getElementById('arbitro-modal-overlay');
const modalTitle = document.getElementById('arbitro-modal-title');
const form = document.getElementById('form-arbitro');
const inputId = document.getElementById('input-arbitro-id');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputBuscarApellido = document.getElementById('input-buscar-apellido');
const btnBuscar = document.getElementById('btn-buscar-arbitro');
const btnAgregar = document.getElementById('btn-agregar-arbitro');
const thAcciones = document.getElementById('th-acciones');
const btnCancelar = document.getElementById('btn-cancelar-arbitro');

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderTabla(lista) {
    const permitido = puedeEscribir('arbitros');

    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="' + (permitido ? 3 : 2) + '">No se encontraron árbitros.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (arbitro) {
        const acciones = permitido
            ? '<div class="actions-cell">'
                + '<button type="button" class="btn-edit" data-action="editar" data-id="' + arbitro.id + '">Modificar</button>'
                + '<button type="button" class="btn-delete" data-action="eliminar" data-id="' + arbitro.id + '">Eliminar</button>'
                + '</div>'
            : '';

        return '<tr>'
            + '<td>' + escapeHtml(arbitro.nombre) + '</td>'
            + '<td>' + escapeHtml(arbitro.apellido) + '</td>'
            + (permitido ? '<td>' + acciones + '</td>' : '')
            + '</tr>';
    }).join('');
}

function listaFiltrada() {
    if (!ultimaBusqueda) {
        return arbitros;
    }
    const consulta = ultimaBusqueda.toLowerCase();
    return arbitros.filter(function (arbitro) {
        return arbitro.apellido.toLowerCase().includes(consulta);
    });
}

function renderConFiltroActual() {
    renderTabla(listaFiltrada());
}

function aplicarPermisosUI() {
    btnAgregar.hidden = !puedeEscribir('arbitros');
    thAcciones.hidden = !puedeEscribir('arbitros');
    renderConFiltroActual();
}

async function cargarArbitroes() {
    try {
        const respuesta = await fetch('/api/arbitros');
        arbitros = respuesta.ok ? await respuesta.json() : [];
        renderConFiltroActual();
    } catch (error) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="3">No se pudo conectar con el servidor. Entrá por http://localhost:3000/ con el backend corriendo (npm start).</td></tr>';
    }
}

function abrirModalAgregar() {
    if (!puedeEscribir('arbitros')) {
        return;
    }
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Agregar Árbitro';
    overlay.hidden = false;
    inputNombre.focus();
}

function abrirModalEditar(id) {
    if (!puedeEscribir('arbitros')) {
        return;
    }
    const arbitro = arbitros.find(function (e) { return e.id === id; });
    if (!arbitro) {
        return;
    }
    inputId.value = arbitro.id;
    inputNombre.value = arbitro.nombre;
    inputApellido.value = arbitro.apellido;
    modalTitle.textContent = 'Modificar Árbitro';
    overlay.hidden = false;
    inputNombre.focus();
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
    inputId.value = '';
}

async function eliminarArbitro(id) {
    if (!puedeEscribir('arbitros')) {
        return;
    }
    const arbitro = arbitros.find(function (e) { return e.id === id; });
    if (!arbitro) {
        return;
    }
    const confirmado = confirm('¿Seguro que deseas eliminar a ' + arbitro.nombre + ' ' + arbitro.apellido + '?');
    if (!confirmado) {
        return;
    }
    const respuesta = await fetch('/api/arbitros/' + id, { method: 'DELETE' });
    if (!respuesta.ok) {
        alert('No se pudo eliminar el árbitro.');
        return;
    }
    await cargarArbitroes();
    alert('Árbitro eliminado correctamente.');
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
        eliminarArbitro(id);
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
    if (enviandoFormulario || !puedeEscribir('arbitros')) {
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
    const url = idEditado !== null ? '/api/arbitros/' + idEditado : '/api/arbitros';
    const metodo = idEditado !== null ? 'PUT' : 'POST';

    const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        alert('No se pudo guardar el árbitro.');
        enviandoFormulario = false;
        return;
    }

    await cargarArbitroes();
    cerrarModal();
    enviandoFormulario = false;
});

aplicarPermisosUI();
cargarArbitroes();
