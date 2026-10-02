let arbitros = [
    { id: 1, nombre: 'John', apellido: 'Wilkinson' },
    { id: 2, nombre: 'Peter', apellido: 'Bell' },
    { id: 3, nombre: 'Marie', apellido: 'Dubois' },
];

const tbody = document.getElementById('arbitros-tbody');
const overlay = document.getElementById('arbitro-modal-overlay');
const modalTitle = document.getElementById('arbitro-modal-title');
const form = document.getElementById('form-arbitro');
const inputNombre = document.getElementById('input-nombre');
const inputApellido = document.getElementById('input-apellido');
const inputBuscarApellido = document.getElementById('input-buscar-apellido');
const btnBuscar = document.getElementById('btn-buscar-arbitro');
const btnAgregar = document.getElementById('btn-agregar-arbitro');
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
    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="2">No se encontraron árbitros.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (arbitro) {
        return '<tr>'
            + '<td>' + escapeHtml(arbitro.nombre) + '</td>'
            + '<td>' + escapeHtml(arbitro.apellido) + '</td>'
            + '</tr>';
    }).join('');
}

function buscar() {
    const consulta = inputBuscarApellido.value.trim().toLowerCase();
    const lista = consulta
        ? arbitros.filter(function (arbitro) { return arbitro.apellido.toLowerCase().includes(consulta); })
        : arbitros;
    renderTabla(lista);
}

function abrirModalAgregar() {
    form.reset();
    modalTitle.textContent = 'Agregar Árbitro';
    overlay.hidden = false;
    inputNombre.focus();
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
}

function agregarArbitro(nombre, apellido) {
    const nuevoId = arbitros.reduce(function (maxId, a) { return Math.max(maxId, a.id); }, 0) + 1;
    arbitros.push({ id: nuevoId, nombre: nombre, apellido: apellido });
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

    if (!nombre || !apellido) {
        return;
    }

    agregarArbitro(nombre, apellido);
    cerrarModal();
    buscar();
});
