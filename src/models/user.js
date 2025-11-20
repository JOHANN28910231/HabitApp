const pool = require('../utils/db');

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id_usuario, nombre_completo, email, telefono, genero, municipio, estado, nacionalidad, fecha_nacimiento, fecha_registro, estado_cuenta
     FROM usuarios WHERE id_usuario = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM usuarios WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function create({ email, nombre_completo, password_hash, telefono, genero }) {
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, genero)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre_completo || null, email, password_hash, telefono || null, genero || null]
  );
  return findById(result.insertId);
}

async function updateProfile(id, data) {
  const fields = [];
  const params = [];
  ['nombre_completo', 'telefono', 'genero', 'municipio', 'estado', 'nacionalidad', 'fecha_nacimiento'].forEach(k => {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  });
  if (fields.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`, params);
  return findById(id);
}

async function setPassword(id, password_hash) {
  await pool.query(`UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?`, [password_hash, id]);
  return findById(id);
}

// Roles: obtener roles del usuario
async function getRoles(id_usuario) {
  const [rows] = await pool.query(
    `SELECT r.nombre FROM usuario_rol ur JOIN roles r USING(id_rol) WHERE ur.id_usuario = ?`,
    [id_usuario]
  );
  return rows.map(r => r.nombre);
}

async function addRole(id_usuario, roleName) {
  // busca id_rol
  const [r] = await pool.query(`SELECT id_rol FROM roles WHERE nombre = ?`, [roleName]);
  if (!r[0]) throw new Error('rol no existe');
  await pool.query(`INSERT IGNORE INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)`, [id_usuario, r[0].id_rol]);
}

async function listAll(limit = 100, offset = 0) {
  const [rows] = await pool.query(
    `SELECT id_usuario, nombre_completo, email, telefono, genero, municipio, estado, nacionalidad, fecha_nacimiento, fecha_registro, estado_cuenta
     FROM usuarios LIMIT ? OFFSET ?`, [Number(limit), Number(offset)]
  );
  return rows;
}

async function removeUser(id) {
  await pool.query(`DELETE FROM usuarios WHERE id_usuario = ?`, [id]);
}

async function setAccountState(id, state) {
  await pool.query(`UPDATE usuarios SET estado_cuenta = ? WHERE id_usuario = ?`, [state, id]);
  return findById(id);
}

module.exports = { findById, findByEmail, create, updateProfile, setPassword, getRoles, addRole, listAll, removeUser, setAccountState };
