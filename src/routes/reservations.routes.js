// src/routes/reservations.routes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const {
    createReservation,
    getMyReservations,
    cancelReservation,
} = require('../controllers/reservations.controller');

// Crear reserva (huésped autenticado)
router.post('/', requireAuth, createReservation);

// Ver reservas del huésped actual
router.get('/mine', requireAuth, getMyReservations);

// Cancelar reserva
router.put('/:id/cancel', requireAuth, cancelReservation);

module.exports = router;
