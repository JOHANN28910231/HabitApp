// src/controllers/reservations.controller.js
const { getRoomById } = require('../models/room.model');
const {
    createReservationWithLock,
    getReservationsByGuest,
    getReservationById,
    updateReservationStatus,
} = require('../models/reservation.model');
const { normalizeDate, rangesOverlap } = require('../utils/dateUtils');
const { calculateTotalAmount } = require('../utils/calcPrice');

/**
 * POST /api/reservations
 * Body: { id_habitacion, fecha_inicio, fecha_salida, tipo_alojamiento }
 */
async function createReservation(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Debes iniciar sesión para reservar' });
        }

        const id_huesped = req.user.id_usuario; // cuando Santiago llene la sesión

        const { id_habitacion, fecha_inicio, fecha_salida, tipo_alojamiento } = req.body;

        if (!id_habitacion || !fecha_inicio || !fecha_salida || !tipo_alojamiento) {
            return res.status(400).json({ error: 'Faltan datos para crear la reserva' });
        }

        const from = normalizeDate(fecha_inicio);
        const to = normalizeDate(fecha_salida);

        const room = await getRoomById(id_habitacion);
        if (!room) {
            return res.status(404).json({ error: 'Habitación no encontrada o inactiva' });
        }

        const monto_total = calculateTotalAmount(
            tipo_alojamiento,
            room,
            from,
            to
        );

        const result = await createReservationWithLock({
            id_habitacion,
            id_huesped,
            fecha_inicio: from,
            fecha_salida: to,
            monto_total,
        });

        if (!result.success && result.reason === 'overlap') {
            return res.status(409).json({
                error: 'Las fechas seleccionadas ya no están disponibles',
            });
        }

        return res.status(201).json({
            message: 'Reservación creada en estado en_proceso',
            id_reservacion: result.id_reservacion,
            monto_total,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/reservations/mine
 */
async function getMyReservations(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }
        const id_huesped = req.user.id_usuario;
        const reservas = await getReservationsByGuest(id_huesped);
        res.json(reservas);
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /api/reservations/:id/cancel
 * - Aplica lógica de RF019 más adelante (con Daniel, Pagos/reembolsos)
 */
async function cancelReservation(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }
        const id_reservacion = Number(req.params.id);
        const reserva = await getReservationById(id_reservacion);

        if (!reserva) {
            return res.status(404).json({ error: 'Reservación no encontrada' });
        }

        // Opcional: verificar que la reserva pertenece al huésped actual
        if (reserva.id_huesped !== req.user.id_usuario) {
            return res.status(403).json({ error: 'No puedes cancelar esta reserva' });
        }

        // Aquí solo marcamos como cancelado; el tema del reembolso lo hará Pagos
        const ok = await updateReservationStatus(id_reservacion, 'cancelado');
        if (!ok) {
            return res.status(500).json({ error: 'No se pudo cancelar la reserva' });
        }

        res.json({ message: 'Reserva cancelada (falta lógica de reembolso RF019)' });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createReservation,
    getMyReservations,
    cancelReservation,
};
