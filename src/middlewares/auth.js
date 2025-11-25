﻿const { findById, getRoles } = require('../models/user');

async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'No autorizado' });
    const user = await findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    user.roles = await getRoles(user.id_usuario);
    // map safe user
    req.user = {
      id: user.id_usuario,
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono,
      genero: user.genero,
      municipio: user.municipio,
      estado: user.estado,
      nacionalidad: user.nacionalidad,
      fecha_nacimiento: user.fecha_nacimiento,
      foto_url: user.foto_url,
      fecha_registro: user.fecha_registro,
      estado_cuenta: user.estado_cuenta,
      roles: user.roles
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const ok = req.user.roles && req.user.roles.some(r => allowedRoles.includes(r));
    if (!ok) return res.status(403).json({ error: 'Prohibido' });
    next();
  };
}

module.exports = { requireAuth, requireRole };