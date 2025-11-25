// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminC = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Hosts
router.get('/admin/hosts', requireAuth, requireRole('admin_global'), adminC.getHosts);
router.get('/admin/hosts/:id', requireAuth, requireRole('admin_global'), adminC.getHostDetails);

// Properties (admin)
router.get('/admin/properties', requireAuth, requireRole('admin_global'), adminC.getProperties);
router.delete('/admin/properties/:id', requireAuth, requireRole('admin_global'), adminC.deleteProperty);

// Habitaciones (admin)
router.delete('/admin/habitaciones/:id', requireAuth, requireRole('admin_global'), adminC.deleteRoom);

module.exports = router;
