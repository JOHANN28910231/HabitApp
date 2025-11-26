const db = require('../utils/db');


async function createPayment({ id_reservacion, monto, metodo_pago = 'tarjeta', estado_pago = 'pendiente', referencia = null }) {
    const sql = `INSERT INTO pagos (id_reservacion, monto, metodo_pago, estado_pago, referencia) VALUES (?, ?, ?, ?, ?)`;
    const [res] = await db.execute(sql, [id_reservacion, monto, metodo_pago, estado_pago, referencia]);
    return { insertId: res.insertId };
}


async function getPaymentsByReservation(id_reservacion) {
    const sql = `SELECT * FROM pagos WHERE id_reservacion = ? ORDER BY fecha_pago DESC`;
    const [rows] = await db.execute(sql, [id_reservacion]);
    return rows;
}


async function getApprovedPaymentsInRange(from, to) {
    const sql = `SELECT p.*, r.id_habitacion, r.id_huesped, p.fecha_pago FROM pagos p JOIN reservaciones r ON p.id_reservacion = r.id_reservacion WHERE p.estado_pago = 'aprobado' AND DATE(p.fecha_pago) BETWEEN ? AND ?`;
    const [rows] = await db.execute(sql, [from, to]);
    return rows;
}


module.exports = { createPayment, getPaymentsByReservation, getApprovedPaymentsInRange };
