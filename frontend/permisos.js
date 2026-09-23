const PERMISOS = {
    partidos: { escribir: ['arbitro', 'admin'] },
    jugadores: { escribir: ['admin'] },
    entrenadores: { escribir: ['admin'] },
    arbitros: { escribir: ['admin'] },
};

let sesionActual = null;

function mostrarAvisoSiFaltaServidor() {
    if (location.protocol !== 'file:') {
        return;
    }
    const aviso = document.createElement('div');
    aviso.style.cssText = 'background:#c0392b;color:#fff;padding:1rem;text-align:center;font-family:sans-serif;position:sticky;top:0;z-index:999;';
    aviso.textContent = 'Esta página se abrió como archivo local y no va a funcionar. Iniciá el servidor (npm start en la carpeta backend) y entrá por http://localhost:3000/ en vez de abrir el .html directamente.';
    document.body.prepend(aviso);
}

function puedeEscribir(entidad) {
    return !!sesionActual && PERMISOS[entidad].escribir.includes(sesionActual.rol);
}

function escapeHtmlSesion(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function cerrarMenuUsuario() {
    const menu = document.getElementById('menu-usuario');
    if (menu) {
        menu.hidden = true;
    }
}

function renderBloqueSesion() {
    const contenedor = document.getElementById('sesion-navbar');
    if (!contenedor) {
        return;
    }

    if (!sesionActual) {
        contenedor.innerHTML = '<a href="login.html">Iniciar sesión</a>';
        return;
    }

    contenedor.innerHTML = '<button type="button" class="chip-usuario" id="chip-usuario">'
        + escapeHtmlSesion(sesionActual.nombreUsuario) + ' (' + escapeHtmlSesion(sesionActual.rol) + ')'
        + '</button>'
        + '<div class="menu-usuario" id="menu-usuario" hidden>'
        + '<button type="button" class="btn-logout" id="btn-logout">Cerrar sesión</button>'
        + '</div>';

    const menu = document.getElementById('menu-usuario');
    document.getElementById('chip-usuario').addEventListener('click', function (evento) {
        evento.stopPropagation();
        menu.hidden = !menu.hidden;
    });
    document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
}

async function cerrarSesion() {
    await fetch('/api/auth/logout', { method: 'POST' });
    sesionActual = null;
    renderBloqueSesion();
    document.dispatchEvent(new CustomEvent('rolCambiado'));
}

async function cargarSesion() {
    try {
        const respuesta = await fetch('/api/auth/me');
        sesionActual = respuesta.ok ? await respuesta.json() : null;
    } catch (error) {
        sesionActual = null;
    }
    renderBloqueSesion();
    document.dispatchEvent(new CustomEvent('rolCambiado'));
}

document.addEventListener('click', cerrarMenuUsuario);

document.addEventListener('DOMContentLoaded', function () {
    mostrarAvisoSiFaltaServidor();
    cargarSesion();
});
