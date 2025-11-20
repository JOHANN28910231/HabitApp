// src/controllers/availability.controller.js
const {
    getReservationsForRoomInRange,
    getBlocksForRoomInRange,
} = require('../models/reservation.model');
const { normalizeDate } = require('../utils/dateUtils');

/**
 * GET /api/availability/room/:id_habitacion?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
async function getRoomAvailability(req, res, next) {
    try {
        const id_habitacion = Number(req.params.id_habitacion);
        const { from, to } = req.query;

        if (!id_habitacion || !from || !to) {
            return res.status(400).json({
                error: 'Debes enviar id_habitacion, from y to',
            });
        }

        const fromNorm = normalizeDate(from);
        const toNorm = normalizeDate(to);

        const [reservas, bloqueos] = await Promise.all([
            getReservationsForRoomInRange(id_habitacion, fromNorm, toNorm),
            getBlocksForRoomInRange(id_habitacion, fromNorm, toNorm),
        ]);

        return res.json({
            id_habitacion,
            from: fromNorm,
            to: toNorm,
            reservas,
            bloqueos,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getRoomAvailability,
};
