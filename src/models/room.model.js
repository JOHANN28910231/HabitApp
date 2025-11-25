// src/models/room.model.js
const db = require('../utils/db');
const {
    getReservationsForRoomInRange,
    getBlocksForRoomInRange,
} = require('./reservation.model'); // <- usamos tus helpers de reservas

/**
 * Obtiene una habitación por id, con sus precios.
 */
async function getRoomById(id_habitacion) {
    const [rows] = await db.execute(
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
 * Crear habitación
 */
async function createRoom({
    id_propiedad,
    descripcion,
    capacidad_maxima,
    precio_por_noche,
    precio_por_semana,
    precio_por_mes,
}) {
    const [result] = await db.execute(
        `INSERT INTO habitacion 
      (id_propiedad, descripcion, capacidad_maxima, precio_por_noche, precio_por_semana, precio_por_mes) 
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            id_propiedad,
            descripcion,
            capacidad_maxima,
            precio_por_noche,
            precio_por_semana,
            precio_por_mes,
        ]
    );

    return result.insertId;
}

//  Actualizar habitación
async function updateRoom(id, data) {
    const fields = [];
    const values = [];

    for (const key in data) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
    }

    values.push(id);

    const [result] = await db.execute(
        `UPDATE habitacion SET ${fields.join(', ')} WHERE id_habitacion = ?`,
        values
    );

    return result.affectedRows > 0;
}


//  Eliminar habitación
async function deleteRoom(id) {
    const [result] = await db.execute(
        `DELETE FROM habitacion WHERE id_habitacion = ?`,
        [id]
    );

    return result.affectedRows > 0;
}


//  Listar habitaciones por propiedad
async function listRoomsByProperty(id_propiedad) {
    const [rows] = await db.execute(
        `SELECT * FROM habitacion WHERE id_propiedad = ?`,
        [id_propiedad]
    );

    return rows;
}


//  Agregar foto a habitación
async function addRoomPhoto(id_habitacion, url) {
    const [result] = await db.execute(
        `INSERT INTO habitacion_foto (id_habitacion, url)
     VALUES (?, ?)`,
        [id_habitacion, url]
    );

    return result.insertId;
}


//  Establecer servicios de habitación (borra todos los servicios anteriores de la habitación y guarda solo los nuevos.)
async function setRoomServices(id_habitacion, servicios = []) {
    await db.execute(
        `DELETE FROM habitacion_servicio WHERE id_habitacion = ?`,
        [id_habitacion]
    );

    for (const id_servicio of servicios) {
        await db.execute(
            `INSERT INTO habitacion_servicio (id_habitacion, id_servicio)
       VALUES (?, ?)`,
            [id_habitacion, id_servicio]
        );
    }

    return true;
}


//  Crear bloqueo de calendario
async function addRoomBlock(id_habitacion, fecha_inicio, fecha_fin, motivo) {
    const [result] = await db.execute(
        `INSERT INTO habitacion_bloqueo (id_habitacion, fecha_inicio, fecha_fin, motivo)
     VALUES (?, ?, ?, ?)`,
        [id_habitacion, fecha_inicio, fecha_fin, motivo]
    );

    return result.insertId;
}

//  Obtener detalles completos de una habitación
async function getRoomDetails(id_habitacion) {
    // Obtener datos de la habitación
    const [habitacion] = await db.execute(
        `SELECT * FROM habitacion WHERE id_habitacion = ?`,
        [id_habitacion]
    );

    if (habitacion.length === 0) return null;

    // Obtener fotos
    const [fotos] = await db.execute(
        `SELECT * FROM habitacion_foto WHERE id_habitacion = ?`,
        [id_habitacion]
    );

    // Obtener servicios
    const [servicios] = await db.execute(
        `SELECT s.* 
         FROM habitacion_servicio hs
         JOIN servicios s ON hs.id_servicio = s.id_servicio
         WHERE hs.id_habitacion = ?`,
        [id_habitacion]
    );

    // Obtener bloqueos
    const [bloqueos] = await db.execute(
        `SELECT * FROM habitacion_bloqueo WHERE id_habitacion = ?`,
        [id_habitacion]
    );

    return {
        ...habitacion[0],
        fotos,
        servicios,
        bloqueos
    };
}

//  Listar habitaciones con todos sus detalles
async function listRoomsByPropertyWithDetails(id_propiedad) {
    const rooms = await listRoomsByProperty(id_propiedad);

    const fullRooms = [];

    for (const room of rooms) {
        const detalles = await getRoomDetails(room.id_habitacion);
        fullRooms.push(detalles);
    }

    return fullRooms;
}

/**
 * Sugerencias de destinos a partir de lo que escribe el usuario.
 * Busca sobre municipio, estado y nombre_propiedad.
 */
async function suggestDestinos(q) {
    const like = `%${q}%`;
    const [rows] = await db.execute(
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
    const [rows] = await db.execute(
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
    createRoom,
    updateRoom,
    deleteRoom,
    listRoomsByProperty,
    addRoomPhoto,
    setRoomServices,
    addRoomBlock,
    getRoomDetails,
    listRoomsByPropertyWithDetails,
    suggestDestinos,
    searchAvailableRooms,
};
