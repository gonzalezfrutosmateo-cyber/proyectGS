function requireRole(...roles) {
    return function (req, res, next) {
        if (!req.session.usuario) {
            return res.status(401).json({ error: 'No hay sesión iniciada' });
        }
        if (!roles.includes(req.session.usuario.rol)) {
            return res.status(403).json({ error: 'No tenés permiso para hacer esto' });
        }
        next();
    };
}

module.exports = { requireRole };
