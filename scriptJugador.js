let jugadores = [
    { id: 1, nombre: 'Rafael', apellido: 'Nadal', nacionalidad: 'España', periodoActivo: '2001-2024', ganancias: '134000000' },
    { id: 2, nombre: 'Roger', apellido: 'Federer', nacionalidad: 'Suiza', periodoActivo: '1998-2022', ganancias: '130000000' },
    { id: 3, nombre: 'Serena', apellido: 'Williams', nacionalidad: 'Estados Unidos', periodoActivo: '1995-2022', ganancias: '94000000' },
    { id: 4, nombre: 'Novak', apellido: 'Djokovic', nacionalidad: 'Serbia', periodoActivo: '2003-Presente', ganancias: '180000000' },
];

let ultimaBusqueda = '';
let enviandoFormulario = false;

const tbody = document.getElementById('jugadores-tbody');
const overlay = document.getElementById('jugador-modal-overlay');
const modalTitle = document.getElementById('jugador-modal-title');
const form = document.getElementById('form-jugador');
const inputId = document.getElementById('input-jugador-id');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputNacionalidad = document.getElementById('input-nacionalidad');
const inputGanancias = document.getElementById('input-ganancias');
const inputBuscarApellido = document.getElementById('input-buscar-apellido');
const btnBuscar = document.getElementById('btn-buscar-jugador');
const btnAgregar = document.getElementById('btn-agregar-jugador');
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
    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="6">No se encontraron jugadores.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (jugador) {
        return '<tr>'
            + '<td>' + escapeHtml(jugador.nombre) + '</td>'
            + '<td>' + escapeHtml(jugador.apellido) + '</td>'
            + '<td>' + escapeHtml(jugador.nacionalidad) + '</td>'
            + '<td>' + escapeHtml(jugador.periodoActivo) + '</td>'
            + '<td>' + escapeHtml(jugador.ganancias) + '</td>'
            + '<td>'
            + '<div class="actions-cell">'
            + '<button type="button" class="btn-edit" data-action="editar" data-id="' + jugador.id + '">Modificar</button>'
            + '<button type="button" class="btn-delete" data-action="eliminar" data-id="' + jugador.id + '">Eliminar</button>'
            + '</div>'
            + '</td>'
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

function abrirModalAgregar() {
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Agregar Jugador';
    overlay.hidden = false;
    inputNombre.focus();
}

function abrirModalEditar(id) {
    const jugador = jugadores.find(function (j) { return j.id === id; });
    if (!jugador) {
        return;
    }
    inputId.value = jugador.id;
    inputNombre.value = jugador.nombre;
    inputApellido.value = jugador.apellido;
    inputNacionalidad.value = jugador.nacionalidad;
    inputGanancias.value = jugador.ganancias;
    modalTitle.textContent = 'Modificar Jugador';
    overlay.hidden = false;
    inputNombre.focus();
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
    inputId.value = '';
}

function agregarJugador(nombre, apellido, nacionalidad, ganancias) {
    const nuevoId = jugadores.reduce(function (maxId, j) { return Math.max(maxId, j.id); }, 0) + 1;
    jugadores.push({
        id: nuevoId,
        nombre: nombre,
        apellido: apellido,
        nacionalidad: nacionalidad,
        ganancias: ganancias,
        periodoActivo: '-',
    });
}

function modificarJugador(id, nombre, apellido, nacionalidad, ganancias) {
    const jugador = jugadores.find(function (j) { return j.id === id; });
    if (!jugador) {
        return;
    }
    jugador.nombre = nombre;
    jugador.apellido = apellido;
    jugador.nacionalidad = nacionalidad;
    jugador.ganancias = ganancias;
}

function eliminarJugador(id) {
    const jugador = jugadores.find(function (j) { return j.id === id; });
    if (!jugador) {
        return;
    }
    const confirmado = confirm('¿Seguro que deseas eliminar a ' + jugador.nombre + ' ' + jugador.apellido + '?');
    if (!confirmado) {
        return;
    }
    jugadores = jugadores.filter(function (j) { return j.id !== id; });
    renderConFiltroActual();
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

form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (enviandoFormulario) {
        return;
    }
    enviandoFormulario = true;

    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const nacionalidad = inputNacionalidad.value.trim();
    const ganancias = inputGanancias.value.replace(/\D/g, '');

    if (!nombre || !apellido || !nacionalidad) {
        enviandoFormulario = false;
        return;
    }

    const idEditado = inputId.value ? Number(inputId.value) : null;

    if (idEditado !== null) {
        modificarJugador(idEditado, nombre, apellido, nacionalidad, ganancias);
    } else {
        agregarJugador(nombre, apellido, nacionalidad, ganancias);
    }

    renderConFiltroActual();
    cerrarModal();
    enviandoFormulario = false;
});

renderTabla(jugadores);
