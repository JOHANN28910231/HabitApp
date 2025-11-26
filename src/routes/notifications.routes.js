// src/routes/notifications.routes.js

const express = require('express');
const router = express.Router();

const {
    sendTest,
    sendReviewInvites,
} = require('../controllers/notifications.controller');

router.post('/test-email', sendTest);
router.post('/send-review-invites', sendReviewInvites);

module.exports = router;
