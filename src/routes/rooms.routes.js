const express = require('express');
const router = express.Router();

const roomsController = require('../controllers/rooms.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');
const pool = require('../utils/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar carpeta de fotos de habitaciones
const uploadDir = path.join(__dirname, '../../public/fotosHabitaciones');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Carpeta de fotos de habitaciones creada:', uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const name = 'habitacion_' + Date.now() + path.extname(file.originalname);
        cb(null, name);
    }
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Solo se permiten imágenes'));
    },
    limits: { fileSize: 6 * 1024 * 1024 }
});

// Obtener catálogo de servicios (público)
router.get('/services', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM servicios ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

// Crear habitación (solo anfitrión)
router.post(
    '/',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.createRoom
);

// Obtener habitaciones por propiedad (solo anfitrión)
router.get(
    '/by-property/:id_propiedad',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.listRoomsByProperty
);

// Registrar fotos de la habitación
router.post(
    '/:id/photos',
    requireAuth,
    requireRole('anfitrion'),
    upload.array('photos', 12),
    roomsController.addPhoto
);

// Guardar servicios incluidos
router.post(
    '/:id/services',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.setServices
);

// Crear bloqueos (habitacion_bloqueo)
router.post(
    '/:id/blocks',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.addBlock
);
// Obtener detalles completos de una habitación (solo anfitrión)
router.get(
    '/detalles/:id',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.getRoomDetails
);

// Obtener habitaciones de una propiedad con todos sus detalles (solo anfitrión)
router.get(
    '/propiedad/:id_propiedad/detalles',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.listRoomsByPropertyWithDetails
);

// Obtener todas las habitaciones disponibles (público)
router.get('/', roomsController.getAllRooms);

// Obtener habitación por id (público)
router.get('/:id', roomsController.getRoomById);

// Actualizar habitación (solo anfitrión)
router.put(
    '/:id',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.updateRoom
);

// Eliminar habitación (solo anfitrión)
router.delete(
    '/:id',
    requireAuth,
    requireRole('anfitrion'),
    roomsController.deleteRoom
);

module.exports = router;
