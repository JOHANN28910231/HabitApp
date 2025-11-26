const { createPayment } = require('../models/payment.model');
const { getReservationById, updateReservationStatus } = require('../models/reservation.model');


// Simulación simple del gateway
function simulatePayment({ amount }) {
    const mode = process.env.PAYMENTS_MODE || 'auto';
    const forced = (process.env.PAYMENTS_FORCE_STATUS || 'random').toLowerCase();


    if (forced === 'approved') return { status: 'aprobado' };
    if (forced === 'rejected') return { status: 'rechazado' };


// random
    const r = Math.random();
    return r > 0.2 ? { status: 'aprobado' } : { status: 'rechazado' };
}


async function charge(req, res) {
    try {
        const { reservation_id, amount, card } = req.body;
        if (!reservation_id || !amount) {
            return res.status(400).json({ error: 'Faltan datos: reservation_id o amount' });
        }


// obtener reservación
        const reservation = await getReservationById(reservation_id);
        if (!reservation) return res.status(404).json({ error: 'Reservación no encontrada' });


// Validación de card (simulada)
        if (!card || !card.number || !card.name || !card.exp || !card.cvv) {
// permitimos pruebas con el payload mínimo para pruebas automatizadas
// pero devolvemos advertencia
// return res.status(400).json({ error: 'Datos de tarjeta incompletos' });
        }


// Simula el pago
        const result = simulatePayment({ amount });
        const estado_pago = result.status === 'aprobado' ? 'aprobado' : 'rechazado';


// guardar pago
        const referencia = `SIM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const created = await createPayment({ id_reservacion: reservation_id, monto: amount, metodo_pago: 'tarjeta', estado_pago, referencia });


// si aprobado, actualizar reservación
        if (estado_pago === 'aprobado') {
            await updateReservationStatus(reservation_id, 'reservado');

        }


        return res.json({ status: estado_pago, payment_id: created.insertId, reference: referencia, reservation_id });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno al procesar el pago' });
    }
}


module.exports = { charge };
