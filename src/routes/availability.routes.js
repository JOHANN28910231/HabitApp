// src/routes/availability.routes.js
const express = require('express');
const router = express.Router();
const {
    getRoomAvailability,
    getDestinoSuggestions,
    searchAvailability,
} = require('../controllers/availability.controller');

// Sugerencias de destino
// GET /api/availability/destinos/sugerencias?q=mer
router.get('/destinos/sugerencias', getDestinoSuggestions);

// Búsqueda de habitaciones disponibles
// GET /api/availability/search?destino=&from=&to=&guests=
router.get('/search', searchAvailability);

// Disponibilidad detallada de UNA habitación
// GET /api/availability/room/:id_habitacion?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/room/:id_habitacion', getRoomAvailability);

module.exports = router;

