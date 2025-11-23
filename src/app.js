require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// =====================================
// 🗄 BD & ROUTES
// =====================================
const pool = require('./utils/db');
const reportsRoutes = require('./routes/reports.routes');
const paymentsRoutes = require('./routes/payments.routes');

// =====================================
// 🔐 Seguridad
// =====================================
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "blob:"],
            "font-src": ["'self'", "https://cdn.jsdelivr.net"],
        }
    }
}));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// =====================================
// 🌐 Archivos estáticos (frontend)
// =====================================
app.use(express.static(path.join(__dirname, '..', 'public')));

// =====================================
// 🛣 RUTAS CORRECTAS
// =====================================
app.use('/api/payments', paymentsRoutes);
app.use('/api', reportsRoutes);

// =====================================
// 🚀 ENDPOINT PARA OBTENER VENTAS DE HOST (solo mostrar todas las ventas)
// =====================================
// Endpoint para mostrar todas las ventas del host (tab Ventas)
app.get('/api/host/:id/ventas', async (req, res) => {
    const hostId = req.params.id;
    try {
        const [rows] = await pool.query(`
            SELECT
                p.nombre_propiedad AS propiedad,
                h.descripcion AS cuarto,
                CONCAT(c.nombre_completo) AS cliente,
                r.fecha_inicio AS fecha_entrada,
                r.fecha_salida AS fecha_salida,
                r.monto_total AS total
            FROM reservaciones r
                     INNER JOIN habitacion h ON h.id_habitacion = r.id_habitacion
                     INNER JOIN propiedades p ON p.id_propiedad = h.id_propiedad
                     INNER JOIN usuarios c ON c.id_usuario = r.id_huesped
            WHERE p.id_anfitrion = ?
            ORDER BY r.fecha_reserva DESC
        `, [hostId]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error obteniendo ventas" });
    }
});


// =====================================
app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = app;
