require('dotenv').config();
// Merged app.js — combina mejoras de HEAD y origin/main
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');

const app = express();

// =====================================
// 🗄 BD & ROUTES
// =====================================
const pool = require('./utils/db');
const reportsRoutes = require('./routes/reports.routes');
const paymentsRoutes = require('./routes/payments.routes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// =====================================
// 🔐 Seguridad / Logs / Parseo
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

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(',').map(s => s.trim()), credentials: true }));
} else {
  app.use(cors());
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Sesión (express-mysql-session si está disponible)
let sessionStore;
try {
  const MySQLStoreFactory = require('express-mysql-session')(session);
  const mysql = require('mysql2');
  const { DB_HOST = '127.0.0.1', DB_PORT = 3306, DB_USER = 'root', DB_PASS = '', DB_NAME = 'habitapp' } = process.env;
  const sessionPool = mysql.createPool({ host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASS, database: DB_NAME, waitForConnections: true, connectionLimit: 5, charset: 'utf8mb4' });
  sessionStore = new MySQLStoreFactory({}, sessionPool);
} catch (err) {
  // fallback to MemoryStore
}

app.use(session({
  name: process.env.SESSION_NAME || 'habitapp.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: Number(process.env.SESSION_MAX_AGE || 24 * 60 * 60 * 1000), sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' }
}));

// =====================================
// Archivos estáticos y rutas públicas
// =====================================
const publicDir = path.join(__dirname, '..', 'public');
app.use('/public', express.static(publicDir));
app.use(express.static(publicDir));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas UI simples
app.get('/register', (req, res) => res.sendFile(path.join(publicDir, 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));

// =====================================
// Rutas API
// =====================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api', reportsRoutes);
app.use('/api/auth', authRoutes);


// =====================================
// Endpoint para mostrar todas las ventas del host (compatibilidad)
app.get('/api/host/:id/ventas', async (req, res) => {
  const hostId = req.params.id;
  try {
    // Seleccionamos la reservación y el último pago asociado (si existe)
    const [rows] = await pool.query(`
      SELECT p.nombre_propiedad AS propiedad,
             p.descripcion AS propiedad_descripcion,
             h.descripcion AS cuarto,
             CONCAT(u.nombre_completo) AS cliente,
             r.fecha_inicio AS fecha_entrada,
             r.fecha_salida AS fecha_salida,
             r.monto_total AS total,
             pag.fecha_pago AS fecha_pago,
             pag.estado_pago AS estado_pago,
             pag.monto AS pago_monto
      FROM reservaciones r
        INNER JOIN habitacion h ON h.id_habitacion = r.id_habitacion
        INNER JOIN propiedades p ON p.id_propiedad = h.id_propiedad
        INNER JOIN usuarios u ON u.id_usuario = r.id_huesped
        LEFT JOIN pagos pag ON pag.id_pago = (
            SELECT id_pago FROM pagos WHERE id_reservacion = r.id_reservacion ORDER BY fecha_pago DESC LIMIT 1
        )
      WHERE p.id_anfitrion = ?
      ORDER BY r.fecha_reserva DESC
    `, [hostId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo ventas' });
  }
});

// =====================================
// Nuevo endpoint: Reservaciones próximas
// =====================================
app.get('/api/host/:hostId/reservaciones/proximas', async (req, res) => {
  const hostId = req.params.hostId;
  const today = new Date().toISOString().slice(0, 10); // hoy
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const to = oneYearLater.toISOString().slice(0, 10);

  const query = `
    SELECT 
      r.id_reservacion,
      p.nombre_propiedad AS propiedad,
      p.descripcion AS propiedad_descripcion,
      h.descripcion AS cuarto,
      u.nombre_completo AS cliente,
      r.fecha_inicio AS fecha_entrada,
      r.fecha_salida AS fecha_salida,
      r.monto_total AS total
    FROM reservaciones r
    JOIN habitacion h ON h.id_habitacion = r.id_habitacion
    JOIN propiedades p ON p.id_propiedad = h.id_propiedad
    JOIN usuarios u ON u.id_usuario = r.id_huesped
    WHERE p.id_anfitrion = ? AND r.fecha_inicio >= ? AND r.fecha_inicio <= ?
    ORDER BY r.fecha_inicio ASC
  `;

  try {
    const [rows] = await pool.query(query, [hostId, today, to]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reservaciones próximas' });
  }
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Fallback SPA / 404
const indexPath = path.join(publicDir, 'login.html');
app.get(/.*/, (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.accepts('html')) return res.sendFile(indexPath, err => { if (err) return next(err); });
  if (req.accepts('json')) return res.status(404).json({ error: 'Recurso no encontrado' });
  res.status(404).type('txt').send('Recurso no encontrado');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;

