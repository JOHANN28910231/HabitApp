const express = require('express');
const router = express.Router();
const { charge } = require('../controllers/payments.controller');
const { requireAuth } = require('../middlewares/auth');

// Endpoint para procesar pagos

 router.post('/charge', charge); // versión sin auth
//router.post('/charge', requireAuth, charge); // versión con auth

module.exports = router;

