
const express = require('express');
const router = express.Router();
const { charge } = require('../controllers/payments.controller');
const { requireAuth } = require('../middlewares/auth');

// Para pruebas locales puedes comentar requireAuth
router.post('/charge', /* requireAuth, */ charge);

module.exports = router;
