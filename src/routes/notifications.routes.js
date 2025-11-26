// src/routes/notifications.routes.js
const express = require('express');
const router = express.Router();

const {
  sendTest,
  sendReviewInvites,
} = require('../controllers/notifications.controller');

// QA: genera un token y una URL para probar el flujo con Thunder
router.post('/test-email', sendTest);

// Job manual: busca reservas ya terminadas sin reseña y manda invitaciones
router.post('/review-invites', sendReviewInvites);

module.exports = router;
