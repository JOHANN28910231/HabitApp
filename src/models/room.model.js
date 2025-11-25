// Manejo de Habitaciones y sus elementos

const db = require('../utils/db');


//  Crear habitación
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
         JOIN servicio s ON hs.id_servicio = s.id_servicio
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


module.exports = {
    createRoom,
    updateRoom,
    deleteRoom,
    listRoomsByProperty,
    addRoomPhoto,
    setRoomServices,
    addRoomBlock,
    getRoomDetails,
    listRoomsByPropertyWithDetails,
};

