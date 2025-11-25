// src/controllers/availability.controller.js
const {
    getReservationsForRoomInRange,
    getBlocksForRoomInRange,
} = require('../models/reservation.model');
const { normalizeDate } = require('../utils/dateUtils');
const {
    suggestDestinos,
    searchAvailableRooms,
} = require('../models/room.model');

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

/**
 * GET /api/availability/destinos/sugerencias?q=mer
 * Devuelve lista de posibles destinos según lo escrito.
 */
async function getDestinoSuggestions(req, res, next) {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) {
            return res.json([]); // no molestamos a la BD con 1 letra
        }

        const sugerencias = await suggestDestinos(q);
        return res.json(sugerencias);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/availability/search?destino=Merida&from=YYYY-MM-DD&to=YYYY-MM-DD&guests=2
 * Busca habitaciones disponibles respetando las reglas de fecha y capacidad.
 */
async function searchAvailability(req, res, next) {
    try {
        const destino = (req.query.destino || '').trim();
        const from = req.query.from;
        const to = req.query.to;
        const guests = Number(req.query.guests || 1);

        if (!from || !to || !guests) {
            return res.status(400).json({
                error: 'Debes enviar from, to y guests',
            });
        }

        const fromNorm = normalizeDate(from);
        const toNorm = normalizeDate(to);

        // Validar fechas: llegada >= hoy, salida > llegada (mínimo 1 noche)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dFrom = new Date(fromNorm);
        const dTo = new Date(toNorm);

        if (Number.isNaN(dFrom.getTime()) || Number.isNaN(dTo.getTime())) {
            return res.status(400).json({ error: 'Fechas inválidas' });
        }

        if (dFrom < today) {
            return res.status(400).json({ error: 'La fecha de llegada no puede ser en el pasado' });
        }

        const diffMs = dTo - dFrom;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays < 1) {
            return res.status(400).json({
                error: 'La fecha de salida debe ser al menos un día después de la llegada (mínimo 1 noche)',
            });
        }

        if (guests < 1) {
            return res.status(400).json({ error: 'El número de huéspedes debe ser al menos 1' });
        }

        const resultados = await searchAvailableRooms({
            destino,
            from: fromNorm,
            to: toNorm,
            guests,
        });

        return res.json({
            destino,
            from: fromNorm,
            to: toNorm,
            guests,
            total: resultados.length,
            resultados,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getRoomAvailability,
    getDestinoSuggestions,
    searchAvailability,
};
