>>>>>>> origin/main
const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// Seguridad y logs
app.use(helmet());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS opcional (configurable desde .env)
if (process.env.CORS_ORIGIN) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN.split(',').map(s => s.trim()),
    credentials: true
  }));
}

// Parseo de body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// trust proxy si se indica (para cookies 'secure' detrás de proxy)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Sesión (usar un store persistente en producción)
// Sesión (usar un store persistente en producción)
// Intentar usar express-mysql-session si está disponible; si no, fallback al MemoryStore
let sessionStore;
try {
  const MySQLStoreFactory = require('express-mysql-session')(session);
  // Use mysql2 callback-style pool for compatibility with express-mysql-session
  const mysql = require('mysql2');
  const {
    DB_HOST = '127.0.0.1', DB_PORT = 3306, DB_USER = 'root', DB_PASS = '', DB_NAME = 'habitapp'
  } = process.env;

  const sessionPool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4'
  });

  sessionStore = new MySQLStoreFactory({}, sessionPool);
  console.log('Session store: using express-mysql-session (mysql2 pool)');
} catch (err) {
  console.warn('express-mysql-session not available or failed, using MemoryStore. To enable persistent sessions run: npm install express-mysql-session');
}

app.use(session({
  name: process.env.SESSION_NAME || 'habitapp.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: Number(process.env.SESSION_MAX_AGE || 24 * 60 * 60 * 1000),
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Directorio público
const publicDir = path.join(__dirname, '..', 'public');
const indexPath = path.join(publicDir, 'login.html');

// Servir archivos estáticos
// - mantengo '/public' para compatibilidad con enlaces actuales
// - y sirvo en la raíz para que '/index.html' y '/' funcionen
// Normalizar rutas comunes: eliminar puntos finales accidentales en la URL
// Ej: '/public/index.html.' -> '/public/index.html'
app.use((req, res, next) => {
  try {
    // Internally rewrite requests that end with trailing dots to the normalized path
    if (typeof req.path === 'string' && req.path.endsWith('.') && req.method === 'GET') {
      const query = req.url.slice(req.path.length) || '';
      const normalizedPath = req.path.replace(/\.+$/g, '');
      req.url = normalizedPath + query;
    }
  } catch (err) {
    console.error('Error normalizando ruta:', err);
  }
  next();
});
app.use('/public', express.static(publicDir));
app.use(express.static(publicDir));

// Servir uploads (avatars) como estático
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas amigables para UI
app.get('/register', (req, res) => res.sendFile(path.join(publicDir, 'register.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Fallback SPA / 404
// Use a RegExp route to avoid path-to-regexp parsing issues with '*' or '/*'
app.get(/.*/, (req, res, next) => {
  // Solo manejar GET para servir recursos estáticos / SPA
  if (req.method !== 'GET') return next();

  // Si el cliente acepta HTML, devolver login.html (SPA)
  if (req.accepts('html')) {
    return res.sendFile(indexPath, err => {
      // si falla (archivo no existe u otro error), continuar al handler de 404/error
      if (err) return next(err);
    });
  }

  // Si el cliente prefiere JSON, enviar 404 JSON
  if (req.accepts('json')) {
    return res.status(404).json({ error: 'Recurso no encontrado' });
  }

  // Por defecto, texto plano
  res.status(404).type('txt').send('Recurso no encontrado');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;
