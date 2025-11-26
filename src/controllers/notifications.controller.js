// src/controllers/notifications.controller.js

const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const { sendTestEmail, sendReviewInviteEmail } = require('../utils/email');

const REVIEW_SECRET = process.env.REVIEW_SECRET;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

async function sendTest(req, res) {
    try {
        await sendTestEmail(req.body.to || "test@example.com", "Correo de prueba desde Notifications API");
        res.json({ ok: true, message: "Correo mock/test enviado." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error enviando correo de prueba." });
    }
}

async function sendReviewInvites(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT r.id_reservacion,
                   r.id_huesped,
                   r.id_habitacion,
                   r.fecha_salida,
                   u.email
            FROM reservaciones r
            JOIN usuarios u ON u.id_usuario = r.id_huesped
            WHERE r.fecha_salida <= CURDATE()
              AND r.estado_reserva IN ('reservado','finalizado')
              AND NOT EXISTS (
                    SELECT 1 FROM resenas rs
                    WHERE rs.id_huesped = r.id_huesped
                    AND   (rs.id_habitacion = r.id_habitacion)
                )
        `);

        if (rows.length === 0) {
            return res.json({ message: "No hay reservaciones pendientes de invitación de reseña." });
        }

        for (const r of rows) {
            const token = jwt.sign(
                {
                    id_reservacion: r.id_reservacion,
                    id_huesped: r.id_huesped,
                    id_habitacion: r.id_habitacion,
                },
                REVIEW_SECRET,
                { expiresIn: "7d" }
            );

            const link = `${PUBLIC_BASE_URL}/reviews.html?token=${token}`;

            await sendReviewInviteEmail(r.email, link);
        }

        res.json({ ok: true, enviados: rows.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generando invitaciones." });
    }
}

module.exports = {
    sendTest,
    sendReviewInvites,
};
