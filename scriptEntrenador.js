let entrenadores = [
    { id: 1, nombre: 'Juan', apellido: 'López', nacionalidad: 'España', especialidad: 'Tenis individual' },
    { id: 2, nombre: 'Maria', apellido: 'García', nacionalidad: 'Argentina', especialidad: 'Entrenamiento físico' },
    { id: 3, nombre: 'Carlos', apellido: 'Rodríguez', nacionalidad: 'Francia', especialidad: 'Estrategia de juego' },
];

const tbody = document.getElementById('entrenadores-tbody');
const overlay = document.getElementById('entrenador-modal-overlay');
const modalTitle = document.getElementById('entrenador-modal-title');
const form = document.getElementById('form-entrenador');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputNacionalidad = document.getElementById('input-nacionalidad');
const inputEspecialidad = document.getElementById('input-especialidad');
const inputBuscarApellido = document.getElementById('input-buscar-apellido');
const btnBuscar = document.getElementById('btn-buscar-entrenador');
const btnAgregar = document.getElementById('btn-agregar-entrenador');
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
    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="4">No se encontraron entrenadores.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (entrenador) {
        return '<tr>'
            + '<td>' + escapeHtml(entrenador.nombre) + '</td>'
            + '<td>' + escapeHtml(entrenador.apellido) + '</td>'
            + '<td>' + escapeHtml(entrenador.nacionalidad) + '</td>'
            + '<td>' + escapeHtml(entrenador.especialidad) + '</td>'
            + '</tr>';
    }).join('');
}

function buscar() {
    const consulta = inputBuscarApellido.value.trim().toLowerCase();
    const lista = consulta
        ? entrenadores.filter(function (entrenador) { return entrenador.apellido.toLowerCase().includes(consulta); })
        : entrenadores;
    renderTabla(lista);
}

function abrirModalAgregar() {
    form.reset();
    modalTitle.textContent = 'Agregar Entrenador';
    overlay.hidden = false;
    inputNombre.focus();
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
}

function agregarEntrenador(nombre, apellido, nacionalidad, especialidad) {
    const nuevoId = entrenadores.reduce(function (maxId, e) { return Math.max(maxId, e.id); }, 0) + 1;
    entrenadores.push({
        id: nuevoId,
        nombre: nombre,
        apellido: apellido,
        nacionalidad: nacionalidad,
        especialidad: especialidad,
    });
}

btnBuscar.addEventListener('click', buscar);
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

form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const nacionalidad = inputNacionalidad.value.trim();
    const especialidad = inputEspecialidad.value.trim();

    if (!nombre || !apellido || !nacionalidad) {
        return;
    }

    agregarEntrenador(nombre, apellido, nacionalidad, especialidad);
    cerrarModal();
    buscar();
});
