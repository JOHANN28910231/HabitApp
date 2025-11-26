// src/controllers/notifications.controller.js

const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const { sendTestEmail, sendReviewInviteEmail } = require('../utils/email');

const REVIEW_SECRET = process.env.REVIEW_SECRET;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * POST /api/notifications/test-email
 * Endpoint para probar TODO el flujo de invitación a reseña en modo mock.
 * - Genera un token JWT con ids de reserva/huesped/habitación.
 * - Construye la URL de reseña (reviews.html?token=...).
 * - Llama a sendReviewInviteEmail (que en modo mock imprime en consola).
 * - Devuelve en JSON el token y la URL para que la uses desde Thunder.
 */
async function sendTest(req, res) {
    try {
        if (!REVIEW_SECRET) {
            return res.status(500).json({
                error: "REVIEW_SECRET no está definido en el .env",
            });
        }

        const {
            to = "test@example.com",
            id_reservacion = 1,
            id_huesped = 1,
            id_habitacion = 1,
        } = req.body || {};

        // 1) Armar payload del token
        const payload = {
            id_reservacion,
            id_huesped,
            id_habitacion,
        };

        // 2) Firmar token JWT
        const token = jwt.sign(payload, REVIEW_SECRET, { expiresIn: "7d" });

        // 3) Construir link que irá en el correo y que usarás en el navegador
        const link = `${PUBLIC_BASE_URL}/reviews.html?token=${encodeURIComponent(token)}`;

        // 4) Enviar correo de invitación (mock/real según config SMTP)
        await sendReviewInviteEmail(to, link);

        // 5) Devolver todo a Thunder para QA
        return res.json({
            ok: true,
            message: "MOCK EMAIL ENVIADO (invitación reseña)",
            to,
            payload,
            token,
            reviewUrl: link,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error enviando correo de prueba." });
    }
}

/**
 * POST /api/notifications/review-invites
 * Job que busca reservas elegibles y manda invitaciones de reseña.
 */
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

        const invites = [];

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

            const link = `${PUBLIC_BASE_URL}/reviews.html?token=${encodeURIComponent(token)}`;

            await sendReviewInviteEmail(r.email, link);

            invites.push({
                email: r.email,
                id_reservacion: r.id_reservacion,
                id_huesped: r.id_huesped,
                id_habitacion: r.id_habitacion,
                token,
                reviewUrl: link,
            });
        }

        res.json({ ok: true, enviados: rows.length, invites });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generando invitaciones." });
    }
}

module.exports = {
    sendTest,
    sendReviewInvites,
};
