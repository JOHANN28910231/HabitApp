const express = require('express');
const router = express.Router();

const {
    ventasPorPeriodo,
    ventasPorRango,
    ventasRangoPdf,
    ventasPeriodoPdf
} = require('../controllers/reports.controller');

router.get('/host/:hostId/ventas/rango', ventasPorRango);
router.get('/host/:hostId/ventas/periodo', ventasPorPeriodo);
router.get('/host/:hostId/ventas/rango/pdf', ventasRangoPdf);
router.get('/host/:hostId/ventas/periodo/pdf', ventasPeriodoPdf);

module.exports = router;
