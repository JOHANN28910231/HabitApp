// src/controllers/reservations.controller.js
const { getRoomById } = require('../models/room.model');
const { getPaymentsByReservation, createPayment } = require('../models/payment.model');

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
const MS_PER_DAY = 24 * 60 * 60 * 1000;
async function cancelReservation(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Debes iniciar sesión' });
        }
        const id_reservacion = Number(req.params.id);
        if (!id_reservacion) {
            return res.status(400).json({ error: 'ID de reservación inválido' });
        }

        const reserva = await getReservationById(id_reservacion);

        if (!reserva) {
            return res.status(404).json({ error: 'Reservación no encontrada' });
        }

        // Verificar que la reserva pertenece al huésped actual
        if (reserva.id_huesped !== req.user.id_usuario) {
            return res.status(403).json({ error: 'No puedes cancelar esta reservación' });
        }

        // Si ya está cancelada, no repetir
        if (reserva.estado_reserva === 'cancelado') {
            return res.status(400).json({ error: 'La reservación ya está cancelada' });
        }

        // Fechas
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const inicio = new Date(reserva.fecha_inicio);
        inicio.setHours(0, 0, 0, 0);

        const diffMs = inicio - today;
        const diffDays = Math.round(diffMs / MS_PER_DAY);

        // Regla: solo puede cancelar ANTES del día de inicio
        if (diffDays <= 0) {
            return res.status(400).json({
                error: 'Solo puedes cancelar antes del día de inicio de la reservación',
            });
        }

        // Lógica de reembolso
        let refundAmount = 0;
        let refundCreated = null;

// Si falta al menos 1 semana => 50% del total pagado aprobado
        if (diffDays >= 7) {
            const pagos = await getPaymentsByReservation(id_reservacion);

            const pagadoAprobado = pagos
                .filter(p => p.estado_pago === 'aprobado')
                .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

            if (pagadoAprobado > 0) {
                refundAmount = pagadoAprobado * 0.5;

                const referencia = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

                // Tomar el metodo de pago original aprobado (si existe), si no, usar 'tarjeta'
                const pagoAprobado = pagos.find(p => p.estado_pago === 'aprobado');
                const metodoPagoRefund = pagoAprobado?.metodo_pago || 'tarjeta';

                // Registramos el reembolso como un "pago" negativo
                refundCreated = await createPayment({
                    id_reservacion,
                    monto: -refundAmount,            // DECIMAL(10,2) permite valores negativos
                    metodo_pago: metodoPagoRefund,   // ✅ 'tarjeta' (válido en el ENUM)
                    estado_pago: 'aprobado',         // ✅ válido en el ENUM
                    referencia,
                });
            }
        }

        // Marcar reservación como cancelada
        const ok = await updateReservationStatus(id_reservacion, 'cancelado');
        if (!ok) {
            return res.status(500).json({ error: 'No se pudo cancelar la reservación' });
        }

        return res.json({
            message:
                refundAmount > 0
                    ? `Reservación cancelada. Se ha generado un reembolso del 50%: $${refundAmount.toFixed(2)}`
                    : 'Reservación cancelada sin reembolso (fuera de la ventana de 7 días o sin pagos aprobados).',
            refundAmount,
            refundCreated,
            diffDays,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createReservation,
    getMyReservations,
    cancelReservation,
};
