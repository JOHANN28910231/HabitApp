// Controller para habitaciones
const RoomModel = require('../models/room.model');

// Crear habitación
async function createRoom(req, res) {
    try {
        const { id_propiedad, descripcion, capacidad_maxima, precio_por_noche, precio_por_semana, precio_por_mes } = req.body;

        // Validación mínima
        if (!id_propiedad) {
            return res.status(400).json({ error: 'Falta id_propiedad' });
        }

        const result = await RoomModel.createRoom({
            id_propiedad,
            descripcion,
            capacidad_maxima,
            precio_por_noche,
            precio_por_semana,
            precio_por_mes
        });

        // RoomModel.createRoom returns the insertId (number)
        res.status(201).json({ message: 'Habitación creada', id_habitacion: result });
    } catch (error) {
        console.error('Error createRoom:', error);
        res.status(500).json({ error: 'Error al crear habitación' });
    }
}

// Listar habitaciones por propiedad
async function listRoomsByProperty(req, res) {
    try {
        const { id_propiedad } = req.params;

        const rooms = await RoomModel.listRoomsByProperty(id_propiedad);

        res.json(rooms);
    } catch (error) {
        console.error('Error listRoomsByProperty:', error);
        res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
}

// Actualizar habitación
async function updateRoom(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;

        const updated = await RoomModel.updateRoom(id, data);

        if (!updated) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }

        res.json({ message: 'Habitación actualizada' });
    } catch (error) {
        console.error('Error updateRoom:', error);
        res.status(500).json({ error: 'Error al actualizar habitación' });
    }
}

// Eliminar habitación
async function deleteRoom(req, res) {
    try {
        const { id } = req.params;

        const deleted = await RoomModel.deleteRoom(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }

        res.json({ message: 'Habitación eliminada' });
    } catch (error) {
        console.error('Error deleteRoom:', error);
        res.status(500).json({ error: 'Error al eliminar habitación' });
    }
}

// Agregar foto
async function addPhoto(req, res) {
    try {
        const { id } = req.params;
        // Support both plain URL (body.url) and multipart file uploads (req.files)
        if (req.files && req.files.length > 0) {
            for (const f of req.files) {
                await RoomModel.addRoomPhoto(id, f.filename);
            }
            return res.json({ message: 'Fotos agregadas', count: req.files.length });
        }

        const { url } = req.body;
        if (url) {
            await RoomModel.addRoomPhoto(id, url);
            return res.json({ message: 'Foto agregada (URL)' });
        }

        return res.status(400).json({ error: 'Falta url o archivos' });
    } catch (error) {
        console.error('Error addPhoto:', error);
        res.status(500).json({ error: 'Error al agregar foto' });
    }
}

// Guardar servicios
async function setServices(req, res) {
    try {
        const { id } = req.params;
        const { servicios } = req.body;

        if (!Array.isArray(servicios)) {
            return res.status(400).json({ error: 'servicios debe ser un array' });
        }

        await RoomModel.setRoomServices(id, servicios);

        res.json({ message: 'Servicios actualizados' });
    } catch (error) {
        console.error('Error setServices:', error);
        res.status(500).json({ error: 'Error al actualizar servicios' });
    }
}

// Crear bloqueo
async function addBlock(req, res) {
    try {
        const { id } = req.params;
        const { fecha_inicio, fecha_fin, motivo } = req.body;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: 'Faltan fechas' });
        }

        await RoomModel.addRoomBlock(id, fecha_inicio, fecha_fin, motivo);

        res.json({ message: 'Bloqueo agregado' });
    } catch (error) {
        console.error('Error addBlock:', error);
        res.status(500).json({ error: 'Error al agregar bloqueo' });
    }
}

// Obtener detalles completos de una habitación por su ID
async function getRoomDetails(req, res) {
    try {
        const { id } = req.params;

        const room = await RoomModel.getRoomDetails(id);

        if (!room) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }

        res.json(room);
    } catch (error) {
        console.error('Error getRoomDetails:', error);
        res.status(500).json({ error: 'Error al obtener detalles' });
    }
}

// Listar todas las habitaciones de una propiedad con detalles completos
async function listRoomsByPropertyWithDetails(req, res) {
    try {
        const { id_propiedad } = req.params;

        const rooms = await RoomModel.listRoomsByPropertyWithDetails(id_propiedad);

        res.json(rooms);
    } catch (error) {
        console.error('Error listRoomsByPropertyWithDetails:', error);
        res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
}

// Obtener todas las habitaciones (público)
async function getAllRooms(req, res) {
    try {
        const rooms = await RoomModel.listRoomsByPropertyWithDetails(null);
        res.json(rooms);
    } catch (error) {
        console.error('Error getAllRooms:', error);
        res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
}

// Obtener habitación por ID (público)
async function getRoomById(req, res) {
    try {
        const { id } = req.params;

        const room = await RoomModel.getRoomDetails(id);

        if (!room) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }

        res.json(room);
    } catch (error) {
        console.error('Error getRoomById:', error);
        res.status(500).json({ error: 'Error al obtener habitación' });
    }
}


module.exports = {
    createRoom,
    listRoomsByProperty,
    updateRoom,
    deleteRoom,
    addPhoto,
    setServices,
    addBlock,
    getRoomDetails,
    listRoomsByPropertyWithDetails,
    getAllRooms,
    getRoomById
};
