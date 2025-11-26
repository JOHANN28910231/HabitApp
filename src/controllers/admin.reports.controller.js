// src/controllers/admin.reports.controller.js
const PDFDocument = require('pdfkit');
const db = require('../utils/db');

const { header, drawTable, safe } = require('./reports.controller');

// Utilidad para obtener nombre de anfitrión por id
async function getHostName(id) {
  const [[row]] = await db.execute('SELECT nombre_completo FROM usuarios WHERE id_usuario = ?', [id]);
  return row ? row.nombre_completo : `ID ${id}`;
}

// Reporte de ventas global para varios anfitriones
exports.ventasPdf = async (req, res) => {
  let hostIds = req.query.hostIds;
  if (!hostIds) return res.status(400).json({ error: 'Faltan anfitriones' });
  if (!Array.isArray(hostIds)) hostIds = [hostIds];

  // Consulta todas las ventas de los anfitriones
  const ventasPorHost = [];
  for (const hostId of hostIds) {
    const [rows] = await db.execute(`
      SELECT p.nombre_propiedad AS propiedad,
             h.descripcion AS cuarto,
             u.nombre_completo AS cliente,
             r.fecha_inicio AS fecha_entrada,
             r.fecha_salida AS fecha_salida,
             pag.fecha_pago AS fecha_pago,
             pag.estado_pago AS estado_pago,
             pag.monto AS total
      FROM reservaciones r
           JOIN habitacion h ON h.id_habitacion = r.id_habitacion
           JOIN propiedades p ON p.id_propiedad = h.id_propiedad
           JOIN usuarios u ON u.id_usuario = r.id_huesped
           JOIN pagos pag ON pag.id_reservacion = r.id_reservacion
      WHERE p.id_anfitrion = ?
      ORDER BY pag.fecha_pago ASC
    `, [hostId]);
    ventasPorHost.push({ hostId, rows });
  }

  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte_admin_ventas.pdf"');
  doc.pipe(res);

  header(doc, 'Reporte de Ventas Global', `Generado: ${new Date().toLocaleString('es-MX')}`);
  doc.y = 80;

  let totalGlobal = 0;
  for (const { hostId, rows } of ventasPorHost) {
    const hostName = await getHostName(hostId);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1B7F5A').text(`Anfitrión: ${hostName} (ID ${hostId})`, { align: 'left' });
    doc.moveDown(0.2);
    if (!rows.length) {
      doc.fontSize(11).fillColor('#000').text('No hay registros.', { align: 'left' });
      continue;
    }
    const headers = ['Propiedad', 'Cuarto', 'Cliente', 'Entrada', 'Salida', 'Pago', 'Total'];
    const rowsMapped = rows.map(r => [
      r.propiedad,
      r.cuarto,
      r.cliente,
      r.fecha_entrada ? new Date(r.fecha_entrada).toLocaleDateString('es-MX') : '-',
      r.fecha_salida ? new Date(r.fecha_salida).toLocaleDateString('es-MX') : '-',
      r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString('es-MX') : '-',
      `$${parseFloat(r.total).toFixed(2)}`
    ]);
    const totalWidth = doc.page.width - 72;
    const endY = drawTable(doc, headers, rowsMapped, 36, doc.y, totalWidth);
    const total = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    totalGlobal += total;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1B7F5A').text(`Total ventas anfitrión: $${total.toFixed(2)}`, 36, endY + 4, { align: 'right' });
    doc.y = endY + 24;
  }
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1B7F5A').text(`TOTAL GLOBAL: $${totalGlobal.toFixed(2)}`, { align: 'right' });
  doc.end();
};
