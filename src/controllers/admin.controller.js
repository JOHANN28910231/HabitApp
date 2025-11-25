// src/controllers/admin.controller.js
const db = require('../utils/db');

/**
 * GET /api/admin/hosts
 * Query params: q (busqueda por nombre/email/id), limit, offset
 */
exports.getHosts = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Number(req.query.limit) || 200;
    const offset = Number(req.query.offset) || 0;

    // Buscamos usuarios que parezcan anfitriones por roles o texto
    let sql = `
      SELECT id_usuario, nombre_completo, correo_electronico, roles, activo
      FROM usuarios
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (LOWER(nombre_completo) LIKE ? OR LOWER(correo_electronico) LIKE ? OR id_usuario = ?) `;
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, q);
    }

    // Añadir heurística por roles: roles LIKE ... OR JSON_CONTAINS...
    sql += ` AND (
        (roles IS NOT NULL AND (roles LIKE '%host%' OR roles LIKE '%anfitri%' OR roles LIKE '%propietar%'))
        OR JSON_CONTAINS(COALESCE(roles, '[]'), '["host"]')
        OR JSON_CONTAINS(COALESCE(roles, '[]'), '["anfitrion"]')
        OR JSON_CONTAINS(COALESCE(roles, '[]'), '["propietario"]')
      )
      ORDER BY nombre_completo ASC
      LIMIT ? OFFSET ?`;

    params.push(limit, offset);

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getHosts error', err);
    res.status(500).json({ error: 'Error obteniendo anfitriones' });
  }
};

/**
 * GET /api/admin/hosts/:id
 * devuelve host + propiedades + habitaciones (summary)
 */
exports.getHostDetails = async (req, res) => {
  try {
    const hostId = Number(req.params.id);
    if (!hostId) return res.status(400).json({ error: 'HostId inválido' });

    const [[hostRow]] = await db.execute(
      `SELECT id_usuario, nombre_completo, correo_electronico, roles, activo FROM usuarios WHERE id_usuario = ? LIMIT 1`, [hostId]
    );
    if (!hostRow) return res.status(404).json({ error: 'Anfitrión no encontrado' });

    const [props] = await db.execute(
      `SELECT id_propiedad, nombre_propiedad, municipio, estado, tipo_propiedad, descripcion, url_fotos_p
       FROM propiedades WHERE id_anfitrion = ?`, [hostId]
    );

    // por cada propiedad obtenemos habitaciones
    const propIds = props.map(p => p.id_propiedad);
    let rooms = [];
    if (propIds.length) {
      const placeholders = propIds.map(() => '?').join(',');
      const [rrows] = await db.execute(
        `SELECT id_habitacion, id_propiedad, descripcion, precio_por_noche, capacidad_maxima FROM habitacion WHERE id_propiedad IN (${placeholders})`,
        propIds
      );
      rooms = rrows;
    }

    res.json({ host: hostRow, propiedades: props, habitaciones: rooms });
  } catch (err) {
    console.error('getHostDetails error', err);
    res.status(500).json({ error: 'Error obteniendo detalles del anfitrión' });
  }
};

/**
 * DELETE /api/admin/properties/:id
 */
exports.deleteProperty = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    // borrar habitaciones de la propiedad
    await db.execute(`DELETE FROM habitacion WHERE id_propiedad = ?`, [id]);
    // borrar la propiedad
    const [result] = await db.execute(`DELETE FROM propiedades WHERE id_propiedad = ?`, [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Propiedad no encontrada' });
    res.json({ ok: true, message: 'Propiedad eliminada' });
  } catch (err) {
    console.error('deleteProperty error', err);
    res.status(500).json({ error: 'Error al eliminar propiedad' });
  }
};

/**
 * DELETE /api/admin/habitaciones/:id
 */
exports.deleteRoom = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const [result] = await db.execute(`DELETE FROM habitacion WHERE id_habitacion = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Habitación no encontrada' });
    res.json({ ok: true, message: 'Habitación eliminada' });
  } catch (err) {
    console.error('deleteRoom error', err);
    res.status(500).json({ error: 'Error al eliminar habitación' });
  }
};

/**
 * GET /api/admin/properties
 * (opcional) lista todas las propiedades (con paginado)
 */
exports.getProperties = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Number(req.query.limit) || 200;
    const offset = Number(req.query.offset) || 0;

    let sql = `SELECT id_propiedad, nombre_propiedad, municipio, estado, id_anfitrion, tipo_propiedad FROM propiedades WHERE 1=1`;
    const params = [];

    if (q) {
      sql += ` AND (LOWER(nombre_propiedad) LIKE ? OR LOWER(municipio) LIKE ? OR LOWER(estado) LIKE ?)`;
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    }

    sql += ` ORDER BY id_propiedad DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getProperties error', err);
    res.status(500).json({ error: 'Error obteniendo propiedades' });
  }
};
