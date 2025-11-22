// src/app.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Aquí luego irán tus middlewares personalizados:
const { attachUserFromSession } = require('./middlewares/auth.middleware');

// Aquí irán tus rutas:
const availabilityRoutes  = require('./routes/availability.routes');   // MÓDULO JOHANN
const reservationsRoutes  = require('./routes/reservations.routes');   // MÓDULO JOHANN

// Ustedes irán agregando:
// const authRoutes        = require('./routes/auth.routes');
// const userRoutes        = require('./routes/users.routes');
// const propertiesRoutes  = require('./routes/properties.routes');
//const roomsRoutes       = require('./routes/rooms.routes');
// const searchRoutes      = require('./routes/search.routes');
// const paymentsRoutes    = require('./routes/payments.routes');
// const reportsRoutes     = require('./routes/reports.routes');
// const reviewsRoutes     = require('./routes/reviews.routes');
// const notificationsRoutes = require('./routes/notifications.routes');

const app = express();

// ---- Middlewares globales de seguridad y parsing ----
app.use(helmet());
app.use(cors({
    origin: '*' // en desarrollo está bien, luego pueden restringir
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Sesiones (RF07) ----
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_super_secret';

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // secure: true en producción con HTTPS
        maxAge: 1000 * 60 * 60 * 2, // 2 horas
    },
}));

// ---- Rate limit sencillo para proteger la API ----
const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
});
app.use('/api', apiLimiter);

// ---- Middleware para exponer el usuario de la sesión en req.user ----
app.use(attachUserFromSession);

// ---- Rutas API (por ahora solo las tuyas, luego los demás enchufan las suyas) ----
app.use('/api/availability', availabilityRoutes);
app.use('/api/reservations', reservationsRoutes);

// Ejemplo de futura integración:
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/properties', propertiesRoutes);
// app.use('/api/rooms', roomsRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/payments', paymentsRoutes);
// app.use('/api/reports', reportsRoutes);
// app.use('/api/reviews', reviewsRoutes);
// app.use('/api/notifications', notificationsRoutes);

// ---- Servir archivos estáticos (frontend) ----
const publicDir = process.env.PUBLIC_DIR || 'public';
app.use(express.static(path.join(__dirname, '..', publicDir)));

// ---- Endpoint de salud (útil para pruebas) ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AppTiziHause API funcionando' });
});

// ---- Manejador de errores simple ----
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
