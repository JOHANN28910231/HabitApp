// =======================================================
// GET /admin/reservas → Todas las reservas con info completa
// =======================================================
exports.getAllReservations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                r.id_reservacion,
                r.estado_reserva,
                r.fecha_inicio AS fecha_entrada,
                r.fecha_salida,
                r.monto_total,
                p.id_propiedad,
                p.nombre_propiedad AS propiedad,
                p.id_anfitrion,
                a.nombre_completo AS anfitrion,
                h.id_habitacion,
                h.descripcion AS cuarto,
                u.id_usuario AS id_cliente,
                u.nombre_completo AS cliente
            FROM reservaciones r
            JOIN habitacion h ON h.id_habitacion = r.id_habitacion
            JOIN propiedades p ON p.id_propiedad = h.id_propiedad
            JOIN usuarios a ON a.id_usuario = p.id_anfitrion
            JOIN usuarios u ON u.id_usuario = r.id_huesped
            ORDER BY r.fecha_inicio DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('getAllReservations error:', err);
        res.status(500).json({ error: 'Error obteniendo reservas' });
    }
};
// src/controllers/admin.controller.js
const db = require('../utils/db');

// =======================================================
// GET /admin/hosts  → Lista de anfitriones (con filtro opcional q)
// =======================================================
exports.getHosts = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = Number(req.query.limit) || 200;
        const offset = Number(req.query.offset) || 0;

        const params = [];

        let sql = `
      SELECT 
        u.id_usuario AS id,
        u.nombre_completo AS nombre,
        u.email,
        u.telefono,
        u.municipio,
        u.estado,
        u.foto_url
      FROM usuarios u
      INNER JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
      INNER JOIN roles r ON r.id_rol = ur.id_rol
      WHERE r.nombre = 'anfitrion'
    `;

        if (q) {
            sql += `
        AND (
          u.nombre_completo LIKE ?
          OR u.email LIKE ?
          OR u.id_usuario LIKE ?
        )
      `;
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        sql += ` ORDER BY u.nombre_completo ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('getHosts error:', err);
        res.status(500).json({ error: 'Error obteniendo anfitriones' });
    }
};

// =======================================================
// GET /admin/hosts/:id/properties → Propiedades de un anfitrión
// =======================================================
exports.getHostProperties = async (req, res) => {
    const hostId = req.params.id;

    try {
        const [rows] = await db.query(
            `
      SELECT 
        p.id_propiedad,
        p.nombre_propiedad,
        p.tipo_propiedad,
        p.municipio,
        p.estado,
        p.estado_propiedad
      FROM propiedades p
      WHERE p.id_anfitrion = ?
      ORDER BY p.nombre_propiedad ASC
    `,
            [hostId]
        );

        res.json(rows);
    } catch (err) {
        console.error('getHostProperties error:', err);
        res.status(500).json({ error: 'Error obteniendo propiedades del anfitrión' });
    }
};

// =======================================================
// GET /admin/properties/:id/rooms → Habitaciones de una propiedad
// =======================================================
exports.getHostRooms = async (req, res) => {
    const propId = req.params.id;

    try {
        const [rows] = await db.query(
            `
      SELECT 
        h.id_habitacion,
        h.descripcion,
        h.capacidad_maxima,
        h.precio_por_noche,
        h.precio_por_semana,
        h.precio_por_mes,
        h.estado_habitacion
      FROM habitacion h
      WHERE h.id_propiedad = ?
      ORDER BY h.id_habitacion ASC
    `,
            [propId]
        );

        res.json(rows);
    } catch (err) {
        console.error('getHostRooms error:', err);
        res.status(500).json({ error: 'Error obteniendo habitaciones' });
    }
};

// =======================================================
// DELETE /admin/properties/:id → Eliminar propiedad
// (opcional: primero borrar habitaciones de esa propiedad)
// =======================================================
exports.deleteProperty = async (req, res) => {
    const id = req.params.id;

    try {
        // Opcional: si tu FK no tiene ON DELETE CASCADE,
        // puedes borrar primero las habitaciones:
        // await db.query(`DELETE FROM habitacion WHERE id_propiedad = ?`, [id]);

        const [result] = await db.query(
            `DELETE FROM propiedades WHERE id_propiedad = ?`,
            [id]
        );

        res.json({ ok: true, deleted: result.affectedRows });
    } catch (err) {
        console.error('deleteProperty error:', err);
        res.status(500).json({ error: 'Error eliminando propiedad' });
    }
};

// =======================================================
// DELETE /admin/rooms/:id → Eliminar habitación
// =======================================================
exports.deleteRoom = async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await db.query(
            `DELETE FROM habitacion WHERE id_habitacion = ?`,
            [id]
        );

        res.json({ ok: true, deleted: result.affectedRows });
    } catch (err) {
        console.error('deleteRoom error:', err);
        res.status(500).json({ error: 'Error eliminando habitación' });
    }
};

