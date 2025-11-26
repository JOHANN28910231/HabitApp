// src/controllers/admin.controller.js

const db = require('../utils/db');

// =======================================================
// GET /admin/hosts  → Lista de anfitriones
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
      console.error('getHostProperties error:', err);
      res.status(500).json({error: 'Error obteniendo propiedades'});
  }
};

exports.deleteProperty = async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await db.query(`
      DELETE FROM propiedades WHERE id_propiedad = ?
    `, [id]);

        res.json({ ok: true, deleted: result.affectedRows });

    } catch (err) {
        console.error('deleteProperty error:', err);
        res.status(500).json({ error: 'Error eliminando propiedad' });
    }
};

// =======================================================
// DELETE habitación
// =======================================================
exports.deleteRoom = async (req, res) => {
    const id = req.params.id;

    try {
        const [result] = await db.query(`
      DELETE FROM habitacion WHERE id_habitacion = ?
    `, [id]);

        res.json({ ok: true, deleted: result.affectedRows });

    } catch (err) {
        console.error('deleteRoom error:', err);
        res.status(500).json({ error: 'Error eliminando habitación' });
    }
};
