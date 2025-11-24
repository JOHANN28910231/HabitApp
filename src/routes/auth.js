const express = require('express');
const router = express.Router();

const c = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/logout', requireAuth, c.logout);
router.get('/me', requireAuth, c.me);

// Admin endpoints to block/unblock account
router.post('/block/:id', requireAuth, requireRole('admin_global'), c.blockUser);
router.post('/unblock/:id', requireAuth, requireRole('admin_global'), c.unblockUser);

// Nueva ruta: solicitar enlace de recuperación
router.post('/forgot-password', c.forgotPassword);

// Nueva ruta: restablecer contraseña con token
router.post('/reset-password', c.resetPassword);

module.exports = router;