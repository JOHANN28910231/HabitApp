// src/models/room.model.js
const pool = require('../utils/db');
const {
    getReservationsForRoomInRange,
    getBlocksForRoomInRange,
} = require('./reservation.model'); // <- usamos tus helpers de reservas

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

/**
 * Sugerencias de destinos a partir de lo que escribe el usuario.
 * Busca sobre municipio, estado y nombre_propiedad.
 */
async function suggestDestinos(q) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
        `SELECT DISTINCT municipio, estado
     FROM propiedades
     WHERE estado_propiedad = 'activa'
       AND (municipio LIKE ? OR estado LIKE ? OR nombre_propiedad LIKE ?)
     ORDER BY municipio
     LIMIT 5`,
        [like, like, like]
    );

    return rows.map(r => ({
        municipio: r.municipio,
        estado: r.estado,
        etiqueta: `${r.municipio}, ${r.estado}`,
    }));
}

/**
 * Busca habitaciones que:
 *  - estén activas
 *  - de propiedades activas
 *  - respeten capacidad >= guests
 *  - coincidan con el destino (municipio/estado/nombre_propiedad)
 *  - NO tengan reservas ni bloqueos en el rango [from, to)
 */
/**
 * Busca habitaciones que:
 *  - estén activas
 *  - de propiedades activas
 *  - respeten capacidad >= guests
 *  - coincidan con el destino (municipio/estado/nombre_propiedad)
 *  - NO tengan reservas ni bloqueos en el rango [from, to)
 */
async function searchAvailableRooms({ destino, from, to, guests }) {
    const raw = (destino || '').trim();

    // Primer parámetro: capacidad mínima
    const params = [guests];
    let ubicFilter = '1=1';

    if (raw) {
        const parts = raw.split(',');
        const cityPart = (parts[0] || '').trim();   // ej. "Tizimín"
        const statePart = (parts[1] || '').trim();  // ej. "Yucatán"

        if (cityPart && statePart) {
            // Caso "Ciudad, Estado" → municipio AND estado
            ubicFilter = `
        (
          (p.municipio LIKE ? AND p.estado LIKE ?)
          OR p.nombre_propiedad LIKE ?
          OR CONCAT(p.municipio, ', ', p.estado) LIKE ?
        )
      `;
            params.push(
                `%${cityPart}%`,   // municipio
                `%${statePart}%`,  // estado
                `%${raw}%`,        // nombre_propiedad
                `%${raw}%`         // "Ciudad, Estado"
            );
        } else {
            // Caso "Mérida" o "Yucatán" (una sola parte) → búsqueda más flexible
            const like = `%${raw}%`;
            ubicFilter = `
        (
          p.municipio LIKE ?
          OR p.estado LIKE ?
          OR p.nombre_propiedad LIKE ?
          OR CONCAT(p.municipio, ', ', p.estado) LIKE ?
        )
      `;
            params.push(like, like, like, like);
        }
    }

    // 1) Candidatas por ubicación + capacidad
    const [rows] = await pool.query(
        `
            SELECT
                h.id_habitacion,
                h.descripcion      AS habitacion_descripcion,
                h.capacidad_maxima,
                h.precio_por_noche,
                h.precio_por_semana,
                h.precio_por_mes,
                p.id_propiedad,
                p.nombre_propiedad,
                p.municipio,
                p.estado
            FROM habitacion h
                     JOIN propiedades p ON p.id_propiedad = h.id_propiedad
            WHERE h.estado_habitacion = 'activa'
              AND p.estado_propiedad = 'activa'
              AND h.capacidad_maxima >= ?
              AND ${ubicFilter}
        `,
        params
    );

    // 2) Filtrar por disponibilidad real (sin reservas ni bloqueos en [from, to))
    const disponibles = [];

    for (const row of rows) {
        const id = row.id_habitacion;

        const [reservas, bloqueos] = await Promise.all([
            getReservationsForRoomInRange(id, from, to),
            getBlocksForRoomInRange(id, from, to),
        ]);

        if (reservas.length === 0 && bloqueos.length === 0) {
            disponibles.push(row);
        }
    }

    return disponibles;
}


module.exports = {
    getRoomById,
    suggestDestinos,
    searchAvailableRooms,
};

