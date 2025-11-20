// src/routes/availability.routes.js
const express = require('express');
const router = express.Router();
const { getRoomAvailability } = require('../controllers/availability.controller');

// GET /api/availability/room/:id_habitacion?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/room/:id_habitacion', getRoomAvailability);

module.exports = router;
