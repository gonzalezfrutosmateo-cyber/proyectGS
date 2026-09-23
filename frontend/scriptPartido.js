const MODALIDADES_LABEL = {
    'individual-masculino': 'Individual Masculino',
    'individual-femenino': 'Individual Femenino',
    'dobles-masculino': 'Dobles Masculino',
    'dobles-femenino': 'Dobles Femenino',
    'dobles-mixto': 'Dobles Mixto',
};

const CANTIDAD_SETS = 5;

let partidos = [];
let jugadoresDisponibles = [];
let ultimoFiltro = { torneo: '', anio: '', modalidad: '' };
let enviandoFormulario = false;

const tbody = document.getElementById('partidos-tbody');
const overlay = document.getElementById('partido-modal-overlay');
const modalTitle = document.getElementById('partido-modal-title');
const form = document.getElementById('form-partido');
const inputId = document.getElementById('input-partido-id');
const inputEdicion = document.getElementById('input-edicion');
const inputFecha = document.getElementById('input-fecha');
const inputFase = document.getElementById('input-fase');
const inputModalidad = document.getElementById('input-modalidad');
const inputEstado = document.getElementById('input-estado');
const inputArbitro = document.getElementById('input-arbitro');
const inputGanador1 = document.getElementById('input-ganador1');
const inputGanador2 = document.getElementById('input-ganador2');
const inputPerdedor1 = document.getElementById('input-perdedor1');
const inputPerdedor2 = document.getElementById('input-perdedor2');
const setsGrid = document.getElementById('sets-grid');
const filtroTorneo = document.getElementById('filtro-torneo');
const filtroAnio = document.getElementById('filtro-anio');
const filtroModalidad = document.getElementById('filtro-modalidad');
const btnBuscar = document.getElementById('btn-buscar-partido');
const btnAgregar = document.getElementById('btn-agregar-partido');
const thAcciones = document.getElementById('th-acciones');
const btnCancelar = document.getElementById('btn-cancelar-partido');

function escapeHtml(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function construirFilasSets() {
    let html = '';
    for (let i = 1; i <= CANTIDAD_SETS; i++) {
        html += '<div class="set-row">'
            + '<span>Set ' + i + '</span>'
            + '<input type="text" class="input-set-ganador" data-set="' + i + '" maxlength="2" inputmode="numeric" placeholder="Games ganador">'
            + '<input type="text" class="input-set-perdedor" data-set="' + i + '" maxlength="2" inputmode="numeric" placeholder="Games perdedor">'
            + '</div>';
    }
    setsGrid.innerHTML = html;
}

function leerSetsDelFormulario() {
    const sets = [];
    const filasGanador = setsGrid.querySelectorAll('.input-set-ganador');
    const filasPerdedor = setsGrid.querySelectorAll('.input-set-perdedor');
    for (let i = 0; i < filasGanador.length; i++) {
        const gamesGanador = filasGanador[i].value.trim();
        const gamesPerdedor = filasPerdedor[i].value.trim();
        if (gamesGanador === '' && gamesPerdedor === '') {
            continue;
        }
        sets.push({ gamesGanador: Number(gamesGanador), gamesPerdedor: Number(gamesPerdedor) });
    }
    return sets;
}

function cargarSetsEnFormulario(sets) {
    const filasGanador = setsGrid.querySelectorAll('.input-set-ganador');
    const filasPerdedor = setsGrid.querySelectorAll('.input-set-perdedor');
    (sets || []).forEach(function (set, indice) {
        if (filasGanador[indice]) {
            filasGanador[indice].value = set.gamesGanador;
            filasPerdedor[indice].value = set.gamesPerdedor;
        }
    });
}

function formatearResultado(sets) {
    if (!sets || sets.length === 0) {
        return '-';
    }
    return sets.map(function (set) { return set.gamesGanador + '-' + set.gamesPerdedor; }).join(', ');
}

function poblarSelect(select, opciones, placeholder) {
    select.innerHTML = '<option value="">' + placeholder + '</option>'
        + opciones.map(function (opcion) {
            return '<option value="' + opcion.id + '">' + escapeHtml(opcion.texto) + '</option>';
        }).join('');
}

async function cargarDatosAuxiliares() {
    let ediciones = [];
    let arbitros = [];
    let jugadores = [];
    try {
        [ediciones, arbitros, jugadores] = await Promise.all([
            fetch('/api/ediciones').then(function (r) { return r.ok ? r.json() : []; }),
            fetch('/api/arbitros').then(function (r) { return r.ok ? r.json() : []; }),
            fetch('/api/jugadores').then(function (r) { return r.ok ? r.json() : []; }),
        ]);
    } catch (error) {
        return;
    }

    jugadoresDisponibles = jugadores;

    poblarSelect(inputEdicion, ediciones.map(function (e) { return { id: e.id, texto: e.torneo + ' ' + e.anio }; }), 'Seleccionar torneo/año...');
    poblarSelect(inputArbitro, arbitros.map(function (a) { return { id: a.id, texto: a.apellido + ', ' + a.nombre }; }), 'Seleccionar árbitro...');

    const opcionesJugadores = jugadores.map(function (j) { return { id: j.id, texto: j.apellido + ', ' + j.nombre }; });
    [inputGanador1, inputGanador2, inputPerdedor1, inputPerdedor2].forEach(function (select) {
        poblarSelect(select, opcionesJugadores, 'Seleccionar jugador...');
    });
}

function actualizarCamposDobles() {
    const esDobles = inputModalidad.value.startsWith('dobles');
    document.querySelectorAll('.campo-dobles').forEach(function (campo) {
        campo.hidden = !esDobles;
    });
    inputGanador2.required = esDobles;
    inputPerdedor2.required = esDobles;
}

function renderTabla(lista) {
    const permitido = puedeEscribir('partidos');

    if (lista.length === 0) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="' + (permitido ? 9 : 8) + '">No se encontraron partidos.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (partido) {
        const acciones = permitido
            ? '<div class="actions-cell">'
                + '<button type="button" class="btn-edit" data-action="editar" data-id="' + partido.id + '">Modificar</button>'
                + '<button type="button" class="btn-delete" data-action="eliminar" data-id="' + partido.id + '">Eliminar</button>'
                + '</div>'
            : '';

        return '<tr>'
            + '<td>' + escapeHtml(partido.torneo) + '</td>'
            + '<td>' + escapeHtml(partido.anio) + '</td>'
            + '<td>' + escapeHtml(partido.fase) + '</td>'
            + '<td>' + escapeHtml(MODALIDADES_LABEL[partido.modalidad] || partido.modalidad) + '</td>'
            + '<td>' + escapeHtml(partido.ganadores || '-') + '</td>'
            + '<td>' + escapeHtml(partido.perdedores || '-') + '</td>'
            + '<td>' + escapeHtml(formatearResultado(partido.sets)) + '</td>'
            + '<td>' + escapeHtml(partido.arbitro) + '</td>'
            + (permitido ? '<td>' + acciones + '</td>' : '')
            + '</tr>';
    }).join('');
}

function listaFiltrada() {
    return partidos.filter(function (partido) {
        const coincideTorneo = !ultimoFiltro.torneo || partido.torneo.toLowerCase().replace(/\s+/g, '-') === ultimoFiltro.torneo;
        const coincideAnio = !ultimoFiltro.anio || String(partido.anio) === ultimoFiltro.anio;
        const coincideModalidad = !ultimoFiltro.modalidad || partido.modalidad === ultimoFiltro.modalidad;
        return coincideTorneo && coincideAnio && coincideModalidad;
    });
}

function renderConFiltroActual() {
    renderTabla(listaFiltrada());
}

function aplicarPermisosUI() {
    btnAgregar.hidden = !puedeEscribir('partidos');
    thAcciones.hidden = !puedeEscribir('partidos');
    renderConFiltroActual();
}

async function cargarPartidos() {
    try {
        const respuesta = await fetch('/api/partidos');
        partidos = respuesta.ok ? await respuesta.json() : [];
        renderConFiltroActual();
    } catch (error) {
        tbody.innerHTML = '<tr class="no-results"><td colspan="9">No se pudo conectar con el servidor. Entrá por http://localhost:3000/ con el backend corriendo (npm start).</td></tr>';
    }
}

function abrirModalAgregar() {
    if (!puedeEscribir('partidos')) {
        return;
    }
    form.reset();
    inputId.value = '';
    construirFilasSets();
    actualizarCamposDobles();
    modalTitle.textContent = 'Agregar Partido';
    overlay.hidden = false;
    inputEdicion.focus();
}

function abrirModalEditar(id) {
    if (!puedeEscribir('partidos')) {
        return;
    }
    const partido = partidos.find(function (p) { return p.id === id; });
    if (!partido) {
        return;
    }
    form.reset();
    inputId.value = partido.id;
    inputFecha.value = partido.fecha ? String(partido.fecha).slice(0, 10) : '';
    inputFase.value = partido.fase;
    inputModalidad.value = partido.modalidad;
    inputEstado.value = partido.estado;
    actualizarCamposDobles();
    construirFilasSets();
    cargarSetsEnFormulario(partido.sets);
    modalTitle.textContent = 'Modificar Partido';
    overlay.hidden = false;
}

function cerrarModal() {
    overlay.hidden = true;
    form.reset();
    inputId.value = '';
}

async function eliminarPartido(id) {
    if (!puedeEscribir('partidos')) {
        return;
    }
    const confirmado = confirm('¿Seguro que deseas eliminar este partido?');
    if (!confirmado) {
        return;
    }
    const respuesta = await fetch('/api/partidos/' + id, { method: 'DELETE' });
    if (!respuesta.ok) {
        alert('No se pudo eliminar el partido.');
        return;
    }
    await cargarPartidos();
    alert('Partido eliminado correctamente.');
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
        eliminarPartido(id);
    }
});

btnBuscar.addEventListener('click', function () {
    ultimoFiltro = {
        torneo: filtroTorneo.value,
        anio: filtroAnio.value,
        modalidad: filtroModalidad.value,
    };
    renderConFiltroActual();
});

btnAgregar.addEventListener('click', abrirModalAgregar);
btnCancelar.addEventListener('click', cerrarModal);
inputModalidad.addEventListener('change', actualizarCamposDobles);

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
    if (enviandoFormulario || !puedeEscribir('partidos')) {
        return;
    }
    enviandoFormulario = true;

    const esDobles = inputModalidad.value.startsWith('dobles');
    const ganadores = [inputGanador1.value];
    const perdedores = [inputPerdedor1.value];
    if (esDobles) {
        ganadores.push(inputGanador2.value);
        perdedores.push(inputPerdedor2.value);
    }

    const datos = {
        edicionId: inputEdicion.value,
        arbitroId: inputArbitro.value,
        fecha: inputFecha.value,
        fase: inputFase.value,
        modalidad: inputModalidad.value,
        estado: inputEstado.value,
        ganadores: ganadores.filter(Boolean).map(Number),
        perdedores: perdedores.filter(Boolean).map(Number),
        sets: leerSetsDelFormulario(),
    };

    const cantidadEsperada = esDobles ? 2 : 1;
    if (!datos.edicionId || !datos.arbitroId || !datos.fecha || !datos.fase || !datos.modalidad
        || datos.ganadores.length !== cantidadEsperada || datos.perdedores.length !== cantidadEsperada) {
        alert('Completá todos los campos obligatorios y la cantidad correcta de jugadores para la modalidad elegida.');
        enviandoFormulario = false;
        return;
    }

    const idEditado = inputId.value ? Number(inputId.value) : null;
    const url = idEditado !== null ? '/api/partidos/' + idEditado : '/api/partidos';
    const metodo = idEditado !== null ? 'PUT' : 'POST';

    const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        const error = await respuesta.json().catch(function () { return {}; });
        alert(error.error || 'No se pudo guardar el partido.');
        enviandoFormulario = false;
        return;
    }

    await cargarPartidos();
    cerrarModal();
    enviandoFormulario = false;
});

aplicarPermisosUI();
cargarDatosAuxiliares();
cargarPartidos();
