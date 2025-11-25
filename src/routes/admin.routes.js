// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

const {
  getHosts,
  getHostProperties,
  getHostRooms,
  deleteProperty,
  deleteRoom
} = require('../controllers/admin.controller');

// ===========================================================
// LISTA DE ANFITRIONES (NUEVO ENDPOINT)
// ===========================================================
router.get('/hosts', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id_usuario AS id,
        u.nombre_completo AS nombre,
        u.email,
        u.telefono,
        u.municipio,
        u.estado,
        u.foto_url
      FROM usuarios u
      INNER JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
      INNER JOIN roles r ON r.id_rol = ur.id_rol
      WHERE r.nombre = 'anfitrion'
      ORDER BY u.nombre_completo ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo anfitriones:', err);
    res.status(500).json({ error: 'Error obteniendo anfitriones' });
  }
});

// ===========================================================
// ENDPOINTS EXISTENTES
// ===========================================================

// === HOSTS ===
router.get('/admin/hosts', getHosts);

// === PROPIEDADES DE UN HOST ===
router.get('/admin/hosts/:id/properties', getHostProperties);

// === HABITACIONES POR PROPIEDAD ===
router.get('/admin/properties/:id/rooms', getHostRooms);

// === ELIMINAR PROPIEDAD ===
router.delete('/admin/properties/:id', deleteProperty);

// === ELIMINAR HABITACIÓN ===
router.delete('/admin/rooms/:id', deleteRoom);

module.exports = router;
