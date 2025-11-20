const db = require('../utils/db');


async function getReservationById(id_reservacion) {
    const sql = `SELECT r.*, h.id_propiedad FROM reservaciones r JOIN habitacion h ON r.id_habitacion = h.id_habitacion WHERE r.id_reservacion = ?`;
    const [rows] = await db.execute(sql, [id_reservacion]);
    return rows[0];
}


async function updateReservationStatus(id_reservacion, estado_reserva) {
    const sql = `UPDATE reservaciones SET estado_reserva = ? WHERE id_reservacion = ?`;
    const [res] = await db.execute(sql, [estado_reserva, id_reservacion]);
    return res.affectedRows;
}


async function getReservationsCountGrouped(period, from, to) {
// period: daily, weekly, monthly, yearly
    let groupBy;
    switch (period) {
        case 'daily':
            groupBy = "DATE(fecha_reserva)";
            break;
        case 'weekly':
            groupBy = "YEAR(fecha_reserva), WEEK(fecha_reserva, 1)";
            break;
        case 'monthly':
            groupBy = "YEAR(fecha_reserva), MONTH(fecha_reserva)";
            break;
        case 'yearly':
            groupBy = "YEAR(fecha_reserva)";
            break;
        default:
            groupBy = "DATE(fecha_reserva)";
    }


    const sql = `SELECT ${groupBy} AS periodo, COUNT(*) AS total_reservas FROM reservaciones WHERE DATE(fecha_reserva) BETWEEN ? AND ? GROUP BY ${groupBy} ORDER BY periodo`;
    const [rows] = await db.execute(sql, [from, to]);
    return rows;
}


module.exports = { getReservationById, updateReservationStatus, getReservationsCountGrouped };