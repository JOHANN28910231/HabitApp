const express = require('express');
const router = express.Router();
const usersCtrl = require('../controllers/usersController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configurar multer para guardar avatars en /uploads/avatars
const avatarsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, avatarsDir); },
  filename: function (req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|jpg)$/.test(file.mimetype)) return cb(null, false);
    cb(null, true);
  }
});

//Storage para IDs
const idsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'uploads', 'ids'));
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `id_${unique}.${ext}`);
    }
});

const uploadId = multer({
    storage: idsStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});


// GET / -> lista usuarios (solo admin_global)
router.get('/', requireAuth, requireRole('admin_global'), async (req, res, next) => {
  try {
    const users = await usersCtrl.list(req, res, next);
    // el controlador ya responde, si devuelve valor lo enviamos
    if (users) return res.json(users);
  } catch (err) { next(err); }
});

// GET /:id -> obtener usuario por id (propio usuario o admin)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    return usersCtrl.getProfile(req, res, next);
  } catch (err) { next(err); }
});

// PUT /me -> actualizar el propio perfil (requiere autenticación)
router.put('/me', requireAuth, upload.single('foto'), async (req, res, next) => {
  try {
    // El controlador usa req.user.id si no hay req.params.id
    return usersCtrl.update(req, res, next);
  } catch (err) { next(err); }
});

// PUT /:id -> actualizar (controlador maneja permisos). Acepta archivo 'foto'
router.put('/:id', requireAuth, upload.single('foto'), async (req, res, next) => {
  try {
    return usersCtrl.update(req, res, next);
  } catch (err) { next(err); }
});

// DELETE /:id -> eliminar (solo admin_global)
router.delete('/:id', requireAuth, requireRole('admin_global'), async (req, res, next) => {
  try {
    return usersCtrl.remove(req, res, next);
  } catch (err) { next(err); }
});

router.post(
    '/me/become-host',
    requireAuth,
    uploadId.single('idFile'),
    usersCtrl.becomeHost
);

module.exports = router;
