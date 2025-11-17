const { findById, updateProfile, setPassword, listAll, removeUser } = require('../models/user');
const bcrypt = require('bcryptjs');

async function getProfile(req, res, next) {
    try {
        const id = Number(req.params.id || req.user.id);
        const u = await findById(id);
        if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ user: u });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const id = Number(req.params.id || req.user.id);
        // solo el propio usuario o admin puede actualizar
        if (id !== req.user.id && !(req.user.roles || []).includes('admin_global')) return res.status(403).json({ error: 'Prohibido' });
        // Si llegó un archivo procesado por multer, añadir foto_url al body
        if (req.file) {
            // ruta pública desde la app: /uploads/avatars/<filename>
            req.body.foto_url = `/uploads/avatars/${req.file.filename}`;
        }

        const updated = await updateProfile(id, req.body);
        if (req.body.password) {
            const hash = await bcrypt.hash(req.body.password, 10);
            await setPassword(id, hash);
        }
        res.json({ user: updated });
    } catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        if (!(req.user.roles || []).includes('admin_global')) return res.status(403).json({ error: 'Prohibido' });
        const users = await listAll(req.query.limit || 100, req.query.offset || 0);
        res.json({ users });
    } catch (err) { next(err); }
}

async function remove(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!(req.user.roles || []).includes('admin_global')) return res.status(403).json({ error: 'Prohibido' });
        await removeUser(id);
        res.json({ ok: true });
    } catch (err) { next(err); }
}

module.exports = { getProfile, update, list, remove };