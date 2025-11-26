// src/middlewares/auth.middleware.js

// (Opcional) si quisieramos un attachUserFromSession distinto, pero
// realmente ya no lo necesitas si siempre usas requireAuth de auth.js
function attachUserFromSession(req, res, next) {
    next();
}

module.exports = {
    attachUserFromSession,
};
