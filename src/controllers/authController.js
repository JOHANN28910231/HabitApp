const bcrypt = require('bcryptjs');
const { findByEmail, create, addRole } = require('../models/user');
const { setAccountState } = require('../models/user');

async function register(req, res, next) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    const nombre = req.body.nombre || req.body.nombre_completo || null;
    const role = (req.body.role || 'huesped').toString();

    // Validaciones básicas
    const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });
    if (!emailRe.test(email)) return res.status(400).json({ error: 'email inválido' });
    if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'la password debe tener al menos 8 caracteres' });
    if (await findByEmail(email)) return res.status(409).json({ error: 'Email ya registrado' });

    // Normalizar role permitido
    const allowedRoles = ['huesped', 'anfitrion', 'admin_global', 'admin_secundario'];
    const roleToAssign = allowedRoles.includes(role) ? role : 'huesped';

    const hash = await bcrypt.hash(password, 10);
    const user = await create({
      email,
      nombre_completo: nombre,
      password_hash: hash,
      telefono: req.body.telefono,
      genero: req.body.genero
    });
    try { await addRole(user.id_usuario, roleToAssign); } catch (e) { /* ignorar si rol no existe */ }

    req.session.userId = user.id_usuario;
    res.status(201).json({ user: { id: user.id_usuario, nombre_completo: user.nombre_completo, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });
    const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRe.test(email)) return res.status(400).json({ error: 'email inválido' });

    const userRow = await findByEmail(email);
    if (!userRow) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (userRow.estado_cuenta === 'bloqueado') return res.status(403).json({ error: 'Cuenta bloqueada' });

    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    req.session.userId = userRow.id_usuario;
    res.json({ user: { id: userRow.id_usuario, nombre_completo: userRow.nombre_completo, email: userRow.email } });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'No se pudo cerrar sesión' });
    res.clearCookie('habitapp.sid');
    res.json({ ok: true });
  });
}

function me(req, res) {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  res.json({ user: req.user });
}


async function blockUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id requerido' });
    await setAccountState(id, 'bloqueado');
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function unblockUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id requerido' });
    await setAccountState(id, 'activo');
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { register, login, logout, me, blockUser, unblockUser };