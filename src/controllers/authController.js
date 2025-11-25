const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { findByEmail, create, addRole, getRoles, setAccountState } = require('../models/user');

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

    // Obtener roles y guardar información esencial en la sesión para RF07
    const roles = await getRoles(user.id_usuario).catch(() => []);
    req.session.userId = user.id_usuario;
    req.session.user = { id_usuario: user.id_usuario, nombre_completo: user.nombre_completo, roles };

    // Asegurar que la sesión se escriba en el store antes de responder (evita condición de carrera)
    req.session.save((err) => {
      if (err) return next(err);
      res.status(201).json({ user: { id: user.id_usuario, nombre_completo: user.nombre_completo, email: user.email, roles } });
    });
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

    const roles = await getRoles(userRow.id_usuario).catch(() => []);
    req.session.userId = userRow.id_usuario;
    req.session.user = { id_usuario: userRow.id_usuario, nombre_completo: userRow.nombre_completo, roles };

    // Asegurar que la sesión se escriba en el store antes de responder (evita condición de carrera)
    req.session.save((err) => {
      if (err) return next(err);
      res.json({ user: { id: userRow.id_usuario, nombre_completo: userRow.nombre_completo, email: userRow.email, roles } });
    });
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

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'El correo es obligatorio.' });
    }

    try {
        // 1) Buscar usuario por email
        const [rows] = await pool.query(
            'SELECT id_usuario, email, nombre_completo FROM usuarios WHERE email = ? LIMIT 1',
            [email]
        );

        // Mensaje genérico para no filtrar si el email existe o no
        const genericMessage =
            'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

        if (rows.length === 0) {
            // No revelar que no existe
            return res.json({ message: genericMessage });
        }

        const user = rows[0];

        // 2) Crear token JWT con expiración (ej. 1 hora)
        const resetToken = jwt.sign(
            {
                id_usuario: user.id_usuario,
                email: user.email,
            },
            process.env.JWT_RESET_SECRET,
            { expiresIn: '1h' }
        );

        // 3) Construir URL hacia el frontend de reset
        const baseUrl = process.env.FRONTEND_BASE_URL;
        const resetUrl = `${baseUrl}/reset.html?token=${encodeURIComponent(resetToken)}`;

        // 4) Aquí deberías enviar un correo real con resetUrl.
        // Por ahora, para desarrollo, lo dejamos en consola:
        console.log('Enlace de recuperación para', user.email, ':', resetUrl);

        // Siempre respondemos el mismo mensaje, exista o no el usuario
        return res.json({ message: genericMessage });
    } catch (err) {
        console.error('Error en forgotPassword:', err);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token y nueva contraseña son obligatorios.' });
    }

    try {
        // 1) Verificar token
        let payload;
        try {
            payload = jwt.verify(
                token,
                process.env.JWT_RESET_SECRET || 'dev_reset_secret'
            );
        } catch (error) {
            console.error('Token inválido o expirado:', error.message);
            return res.status(400).json({ message: 'Enlace inválido o expirado.' });
        }

        const { id_usuario, email } = payload;

        // 2) Hashear nueva contraseña
        const saltRounds = 10;
        const newHash = await bcrypt.hash(password, saltRounds);

        // 3) Actualizar en la BD
        const [result] = await pool.query(
            'UPDATE usuarios SET password_hash = ? WHERE id_usuario = ? AND email = ?',
            [newHash, id_usuario, email]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'No se pudo actualizar la contraseña.' });
        }

        return res.json({ message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
    } catch (err) {
        console.error('Error en resetPassword:', err);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}



module.exports = { register, login, logout, me, blockUser, unblockUser, forgotPassword, resetPassword };