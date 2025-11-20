// src/models/reservation.model.js
const pool = require('../utils/db');

/**
 * Obtiene reservaciones de una habitación en un rango [from, to)
 */
async function getReservationsForRoomInRange(id_habitacion, from, to) {
    const [rows] = await pool.query(
        `SELECT *
         FROM reservaciones
         WHERE id_habitacion = ?
           AND NOT (fecha_salida <= ? OR fecha_inicio >= ?)`,
        [id_habitacion, from, to]
    );
    return rows;
}

/**
 * Obtiene bloqueos de una habitación en un rango [from, to)
 */
async function getBlocksForRoomInRange(id_habitacion, from, to) {
    const [rows] = await pool.query(
        `SELECT *
         FROM habitacion_bloqueo
         WHERE id_habitacion = ?
           AND NOT (fecha_fin <= ? OR fecha_inicio >= ?)`,
        [id_habitacion, from, to]
    );
    return rows;
}

/**
 * Crea una reservación dentro de una transacción,
 * revalidando que no haya traslapes.
 */
async function createReservationWithLock({
                                             id_habitacion,
                                             id_huesped,
                                             fecha_inicio,
                                             fecha_salida,
                                             monto_total,
                                         }) {
    /** @type {import('mysql2/promise').PoolConnection} */
    const conn = await pool.getConnection();   // 👈 IMPORTANTE EL await

    try {
        await conn.beginTransaction();

        // Bloqueamos reservas existentes que traslapen
        const [existingRes] = await conn.query(
            `SELECT *
             FROM reservaciones
             WHERE id_habitacion = ?
               AND NOT (fecha_salida <= ? OR fecha_inicio >= ?)
                 FOR UPDATE`,
            [id_habitacion, fecha_inicio, fecha_salida]
        );

        // Bloqueos de calendario que traslapen
        const [existingBlocks] = await conn.query(
            `SELECT *
             FROM habitacion_bloqueo
             WHERE id_habitacion = ?
               AND NOT (fecha_fin <= ? OR fecha_inicio >= ?)
                 FOR UPDATE`,
            [id_habitacion, fecha_inicio, fecha_salida]
        );

        if (existingRes.length > 0 || existingBlocks.length > 0) {
            await conn.rollback();
            return { success: false, reason: 'overlap' };
        }

        const [result] = await conn.query(
            `INSERT INTO reservaciones
             (id_habitacion, id_huesped, estado_reserva, fecha_inicio, fecha_salida, monto_total)
             VALUES (?, ?, 'en_proceso', ?, ?, ?)`,
            [id_habitacion, id_huesped, fecha_inicio, fecha_salida, monto_total]
        );

        await conn.commit();
        return { success: true, id_reservacion: result.insertId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/**
 * Reservas del huésped
 */
async function getReservationsByGuest(id_huesped) {
    const [rows] = await pool.query(
        `SELECT r.*, h.descripcion, p.nombre_propiedad
         FROM reservaciones r
                  JOIN habitacion h ON h.id_habitacion = r.id_habitacion
                  JOIN propiedades p ON p.id_propiedad = h.id_propiedad
         WHERE r.id_huesped = ?
         ORDER BY r.fecha_reserva DESC`,
        [id_huesped]
    );
    return rows;
}

/**
 * Una reservación por id
 */
async function getReservationById(id_reservacion) {
    const [rows] = await pool.query(
        `SELECT *
         FROM reservaciones
         WHERE id_reservacion = ?`,
        [id_reservacion]
    );
    return rows[0] || null;
}

/**
 * Cambiar estado de la reserva
 */
async function updateReservationStatus(id_reservacion, nuevoEstado) {
    const [result] = await pool.query(
        `UPDATE reservaciones
         SET estado_reserva = ?
         WHERE id_reservacion = ?`,
        [nuevoEstado, id_reservacion]
    );
    return result.affectedRows === 1;
}

module.exports = {
    getReservationsForRoomInRange,
    getBlocksForRoomInRange,
    createReservationWithLock,
    getReservationsByGuest,
    getReservationById,
    updateReservationStatus,
};
