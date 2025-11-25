// src/middlewares/auth.middleware.js

function attachUserFromSession(req, res, next) {
    // Si hay algo guardado en la sesión, lo ponemos como req.user
    if (req.session && req.session.user) {
        req.user = req.session.user;
    } else {
        req.user = null;
    }
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Debes iniciar sesión' });
    }
    next();
}

module.exports = {
    attachUserFromSession,
    requireAuth,
};