// Bloquea al tipear los caracteres no permitidos en los inputs con data-solo="letras" o "numeros".
const reglas = { letras: /^[\p{L} '.,-]$/u, numeros: /^\d$/ };

document.addEventListener('keydown', e => {
    const regla = reglas[e.target.dataset?.solo];
    // key.length === 1 => solo caracteres imprimibles; Tab, Esc, Backspace, flechas, etc. pasan siempre
    if (regla && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !regla.test(e.key)) e.preventDefault();
});
