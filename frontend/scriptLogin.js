const form = document.getElementById('form-login');
const inputUsuario = document.getElementById('input-usuario');
const inputPassword = document.getElementById('input-password');
const loginError = document.getElementById('login-error');

form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    loginError.style.display = 'none';

    const nombreUsuario = inputUsuario.value.trim();
    const passwordHash = btoa(inputPassword.value);

    let respuesta;
    try {
        respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreUsuario: nombreUsuario, passwordHash: passwordHash }),
        });
    } catch (error) {
        loginError.textContent = 'No se pudo conectar con el servidor. ¿Está corriendo (npm start en backend) y estás entrando por http://localhost:3000/?';
        loginError.style.display = 'block';
        return;
    }

    if (respuesta.ok) {
        window.location.href = 'index.html';
    } else {
        loginError.textContent = 'Usuario o contraseña incorrectos.';
        loginError.style.display = 'block';
    }
});
