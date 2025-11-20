
const express = require('express');
const router = express.Router();
const { salesReport, reservationsReport, salesReportPdf } = require('../controllers/reports.controller');
const { requireAuth } = require('../middlewares/auth');

router.get('/sales', /* requireAuth, */ salesReport);
router.get('/reservations', /* requireAuth, */ reservationsReport);
router.get('/sales/pdf', /* requireAuth, */ salesReportPdf);

module.exports = router;
