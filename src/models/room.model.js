// src/models/room.model.js
const pool = require('../utils/db');

/**
 * Obtiene una habitación por id, con sus precios.
 */
async function getRoomById(id_habitacion) {
    const [rows] = await pool.query(
        `SELECT id_habitacion, id_propiedad, descripcion,
            capacidad_maxima, precio_por_noche, precio_por_semana, precio_por_mes,
            estado_habitacion
     FROM habitacion
     WHERE id_habitacion = ? AND estado_habitacion = 'activa'`,
        [id_habitacion]
    );
    return rows[0] || null;
}

module.exports = {
    getRoomById,
};
