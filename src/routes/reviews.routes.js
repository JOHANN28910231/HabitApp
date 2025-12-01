// src/routes/reviews.routes.js

const express = require('express');
const router = express.Router();

const {
    getReviewFromToken,
    createReviewFromToken,
    listReviewsByProperty,
    listReviewsByRoom,
    listAllReviews,
} = require('../controllers/reviews.controller');

router.get('/from-token', getReviewFromToken);
router.post('/from-token', createReviewFromToken);

router.get('/property/:id_propiedad', listReviewsByProperty);
router.get('/room/:id_habitacion', listReviewsByRoom);
router.get('/all', listAllReviews);

module.exports = router;
