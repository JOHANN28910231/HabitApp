const pool = require('../utils/db');
const PDFDocument = require('pdfkit');
const { getApprovedPaymentsInRange } = require('../models/payment.model');
const { getReservationsCountGrouped } = require('../models/reservation.model');

// Helper: agrupa pagos por fecha segun period
async function salesReport(req, res) {
    try {
        const period = req.query.period || 'daily';
        const from = req.query.from;
        const to = req.query.to;
        if (!from || !to) return res.status(400).json({ error: 'from y to son obligatorios' });

        // consulta pagos aprobados en rango
        const rows = await getApprovedPaymentsInRange(from, to);

        // agrupar según period
        const buckets = {};
        rows.forEach(p => {
            let key;
            const dt = new Date(p.fecha_pago);
            switch (period) {
                case 'daily':
                    key = dt.toISOString().slice(0, 10);
                    break;
                case 'monthly':
                    key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'yearly':
                    key = `${dt.getFullYear()}`;
                    break;
                case 'weekly':
                    // ISO week number approximation using yyyy-WW
                    const onejan = new Date(dt.getFullYear(),0,1);
                    const week = Math.ceil((((dt - onejan) / 86400000) + onejan.getDay()+1)/7);
                    key = `${dt.getFullYear()}-W${String(week).padStart(2,'0')}`;
                    break;
                default:
                    key = dt.toISOString().slice(0, 10);
            }

            if (!buckets[key]) buckets[key] = 0;
            buckets[key] += Number(p.monto || 0);
        });

        // convertir a array ordenado
        const result = Object.keys(buckets).sort().map(k => ({ period: k, total: buckets[k] }));
        return res.json({ period, from, to, data: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error generando reporte' });
    }
}

async function reservationsReport(req, res) {
    try {
        const period = req.query.period || 'daily';
        const from = req.query.from;
        const to = req.query.to;
        if (!from || !to) return res.status(400).json({ error: 'from y to son obligatorios' });

        const rows = await getReservationsCountGrouped(period, from, to);
        return res.json({ period, from, to, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error generando reporte' });
    }
}

// HTML imprimible simple -> PDF
async function salesReportPdf(req, res) {
    try {
        const period = req.query.period || 'daily';
        const from = req.query.from;
        const to = req.query.to;
        if (!from || !to) return res.status(400).json({ error: 'from y to son obligatorios' });

        const rows = await getApprovedPaymentsInRange(from, to);

        // build simple HTML or PDF -- usamos PDFKit como ejemplo
        const doc = new PDFDocument({ size: 'A4' });
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-disposition', `attachment; filename="sales_report_${from}_${to}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('Reporte de Ventas', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Periodo: ${from} - ${to}`);
    doc.moveDown();

    let total = 0;
    rows.forEach(r => {
      doc.text(`ID Pago: ${r.id_pago} | Reservación: ${r.id_reservacion} | Monto: ${r.monto} | Fecha: ${new Date(r.fecha_pago).toLocaleString()}`);
      total += Number(r.monto || 0);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ${total.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando PDF' });
  }
}

module.exports = { salesReport, reservationsReport, salesReportPdf };
