const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('../utils/db');

// -----------------------------------------------------------
// Meses
// -----------------------------------------------------------
const meses = {
    "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
    "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
    "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
};

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
function safe(v) {
    return (v === null || v === undefined) ? "-" : String(v);
}

// -----------------------------------------------------------
// HEADER CORPORATIVO
// -----------------------------------------------------------
function header(doc, titulo, subtitulo = "") {
    const verde = "#1B7F5A";

    doc.save();
    doc.rect(0, 0, doc.page.width, 55).fill(verde);
    doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(18).text(titulo, 36, 15);
    if (subtitulo) {
        doc.font("Helvetica").fontSize(10).text(subtitulo, 36, 35);
    }
    doc.restore();
}

// -----------------------------------------------------------
// AUTO-CÁLCULO DE ANCHOS DE COLUMNA
// -----------------------------------------------------------
function computeColumnWidths(doc, headers, rows, totalWidth) {
    const minWidths = headers.map(h => doc.widthOfString(h) + 20);
    const padding = 20;

    rows.forEach(row => {
        row.forEach((cell, i) => {
            const w = doc.widthOfString(safe(cell)) + padding;
            if (w > minWidths[i]) minWidths[i] = w;
        });
    });

    const sum = minWidths.reduce((a, b) => a + b, 0);

    if (sum <= totalWidth) return minWidths;

    const scale = totalWidth / sum;
    return minWidths.map(w => Math.floor(w * scale));
}

// -----------------------------------------------------------
// TABLA PERFECTA — AUTOMÁTICA, SIMÉTRICA, AJUSTA CONTENIDO
// -----------------------------------------------------------
function drawTable(doc, headers, rows, x, y, totalWidth) {
    const headerH = 28;
    const rowH = 26;
    const borderColor = "#bdbdbd";

    const colWidths = computeColumnWidths(doc, headers, rows, totalWidth);

    // -------------------------
    // HEADER
    // -------------------------
    doc.fillColor("#eeeeee")
        .rect(x, y, totalWidth, headerH)
        .fill();

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000");
    let cx = x;

    headers.forEach((h, i) => {
        doc.text(h, cx + 4, y + 8, { width: colWidths[i] - 8, align: "left" });
        doc.rect(cx, y, colWidths[i], headerH).strokeColor(borderColor).stroke();
        cx += colWidths[i];
    });

    y += headerH;

    doc.font("Helvetica").fontSize(9).fillColor("#000");

    // -------------------------
    // FILAS
    // -------------------------
    rows.forEach((row, rIndex) => {
        cx = x;
        const bg = rIndex % 2 === 0 ? "#FFFFFF" : "#f8f8f8";

        doc.fillColor(bg)
            .rect(x, y, totalWidth, rowH)
            .fill();

        row.forEach((cell, i) => {
            doc.fillColor("#000")
                .text(safe(cell), cx + 4, y + 6, {
                    width: colWidths[i] - 8,
                    align: "left"
                });

            doc.rect(cx, y, colWidths[i], rowH)
                .strokeColor(borderColor)
                .stroke();

            cx += colWidths[i];
        });

        y += rowH;
    });

    return y;
}

// -----------------------------------------------------------
// ENDPOINTS JSON — AHORA INCLUYEN FECHA DE PAGO
// -----------------------------------------------------------
exports.ventasPorRango = async (req, res) => {
    try {
        const hostId = Number(req.params.hostId);
        const { from, to } = req.query;

        const [rows] = await db.execute(`
            SELECT p.nombre_propiedad AS propiedad,
                   h.descripcion AS cuarto,
                   u.nombre_completo AS cliente,
                   r.fecha_inicio AS fecha_entrada,
                   r.fecha_salida AS fecha_salida,
                   pag.fecha_pago AS fecha_pago,
                   pag.monto AS total
            FROM reservaciones r
                     JOIN habitacion h ON h.id_habitacion = r.id_habitacion
                     JOIN propiedades p ON p.id_propiedad = h.id_propiedad
                     JOIN usuarios u ON u.id_usuario = r.id_huesped
                     JOIN pagos pag ON pag.id_reservacion = r.id_reservacion
                AND pag.estado_pago='aprobado'
            WHERE p.id_anfitrion = ? AND DATE(r.fecha_reserva) BETWEEN ? AND ?
            ORDER BY r.fecha_reserva ASC
        `, [hostId, from, to]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error" });
    }
};

exports.ventasPorPeriodo = async (req, res) => {
    try {
        const hostId = Number(req.params.hostId);
        const { year, month } = req.query;

        let where = "YEAR(r.fecha_reserva) = ?";
        const params = [year];

        if (month) {
            where += " AND MONTH(r.fecha_reserva) = ?";
            params.push(month);
        }

        const [rows] = await db.execute(`
            SELECT p.nombre_propiedad AS propiedad,
                   h.descripcion AS cuarto,
                   u.nombre_completo AS cliente,
                   r.fecha_inicio AS fecha_entrada,
                   r.fecha_salida AS fecha_salida,
                   pag.fecha_pago AS fecha_pago,
                   pag.monto AS total
            FROM reservaciones r
                     JOIN habitacion h ON h.id_habitacion = r.id_habitacion
                     JOIN propiedades p ON p.id_propiedad = h.id_propiedad
                     JOIN usuarios u ON u.id_usuario = r.id_huesped
                     JOIN pagos pag ON pag.id_reservacion = r.id_reservacion
                AND pag.estado_pago='aprobado'
            WHERE p.id_anfitrion = ? AND ${where}
            ORDER BY r.fecha_reserva ASC
        `, [hostId, ...params]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error" });
    }
};

// -----------------------------------------------------------
// PDF — RANGO (NO CAMBIADO)
// -----------------------------------------------------------
exports.ventasRangoPdf = async (req, res) => {
    const hostId = Number(req.params.hostId);
    const { from, to } = req.query;

    const [rows] = await db.execute(`
        SELECT p.nombre_propiedad AS propiedad,
               h.descripcion AS cuarto,
               u.nombre_completo AS cliente,
               r.fecha_inicio AS fecha_entrada,
               r.fecha_salida AS fecha_salida,
               pag.fecha_pago AS fecha_pago,
               pag.monto AS total
        FROM reservaciones r
                 JOIN habitacion h ON h.id_habitacion = r.id_habitacion
                 JOIN propiedades p ON p.id_propiedad = h.id_propiedad
                 JOIN usuarios u ON u.id_usuario = r.id_huesped
                 JOIN pagos pag ON pag.id_reservacion = r.id_reservacion
            AND pag.estado_pago='aprobado'
        WHERE p.id_anfitrion = ? AND DATE(r.fecha_reserva) BETWEEN ? AND ?
        ORDER BY r.fecha_reserva ASC
    `, [hostId, from, to]);

    const doc = new PDFDocument({ margin: 36, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
        `attachment; filename="reporte_rango_${from}_a_${to}.pdf"`);

    doc.pipe(res);

    header(doc, "Reporte de Ventas por Rango", `Desde ${from} — Hasta ${to}`);
    doc.y = 80;

    if (!rows.length) {
        doc.fontSize(12).text("No hay registros.", { align: "center" });
        return doc.end();
    }

    const headers = ["Propiedad", "Cuarto", "Cliente", "Entrada", "Salida", "Pago", "Total"];

    const rowsMapped = rows.map(r => [
        r.propiedad,
        r.cuarto,
        r.cliente,
        r.fecha_entrada ? new Date(r.fecha_entrada).toLocaleDateString("es-MX") : "-",
        r.fecha_salida ? new Date(r.fecha_salida).toLocaleDateString("es-MX") : "-",
        r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString("es-MX") : "-",
        `$${parseFloat(r.total).toFixed(2)}`
    ]);

    const totalWidth = doc.page.width - 72;

    const endY = drawTable(doc, headers, rowsMapped, 36, doc.y, totalWidth);

    const total = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

    doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#1B7F5A")
        .text(`Total de ventas: $${total.toFixed(2)}`, 36, endY + 10, { align: "right" });

    doc.end();
};

// -----------------------------------------------------------
// PDF — PERIODO (NO CAMBIADO)
// -----------------------------------------------------------
exports.ventasPeriodoPdf = async (req, res) => {
    const hostId = Number(req.params.hostId);
    const { year, month } = req.query;

    let where = "YEAR(r.fecha_reserva) = ?";
    const params = [year];

    if (month) {
        where += " AND MONTH(r.fecha_reserva) = ?";
        params.push(month);
    }

    const [rows] = await db.execute(`
        SELECT p.nombre_propiedad AS propiedad,
               h.descripcion AS cuarto,
               u.nombre_completo AS cliente,
               r.fecha_inicio AS fecha_entrada,
               r.fecha_salida AS fecha_salida,
               pag.fecha_pago AS fecha_pago,
               pag.monto AS total
        FROM reservaciones r
                 JOIN habitacion h ON h.id_habitacion = r.id_habitacion
                 JOIN propiedades p ON p.id_propiedad = h.id_propiedad
                 JOIN usuarios u ON u.id_usuario = r.id_huesped
                 JOIN pagos pag ON pag.id_reservacion = r.id_reservacion
            AND pag.estado_pago='aprobado'
        WHERE p.id_anfitrion = ? AND ${where}
        ORDER BY r.fecha_reserva ASC
    `, [hostId, ...params]);

    const doc = new PDFDocument({ margin: 36, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
        `attachment; filename="reporte_periodo_${year}${month ? "_" + month : ""}.pdf"`);

    doc.pipe(res);

    const titulo = month
        ? `Año ${year} — ${meses[String(month).padStart(2, "0")]}`
        : `Año ${year}`;

    header(doc, "Reporte de Ventas por Período", titulo);
    doc.y = 80;

    if (!rows.length) {
        doc.fontSize(12).text("No hay registros.", { align: "center" });
        return doc.end();
    }

    const headers = ["Propiedad", "Cuarto", "Cliente", "Entrada", "Salida", "Pago", "Total"];

    const rowsMapped = rows.map(r => [
        r.propiedad,
        r.cuarto,
        r.cliente,
        r.fecha_entrada ? new Date(r.fecha_entrada).toLocaleDateString("es-MX") : "-",
        r.fecha_salida ? new Date(r.fecha_salida).toLocaleDateString("es-MX") : "-",
        r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString("es-MX") : "-",
        `$${parseFloat(r.total).toFixed(2)}`
    ]);

    const totalWidth = doc.page.width - 72;

    const endY = drawTable(doc, headers, rowsMapped, 36, doc.y, totalWidth);

    const total = rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

    doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#1B7F5A")
        .text(`Total de ventas: $${total.toFixed(2)}`, 36, endY + 10, { align: "right" });

    doc.end();
};
