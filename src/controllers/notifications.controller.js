// src/controllers/notifications.controller.js

const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const { sendTestEmail, sendReviewInviteEmail } = require('../utils/email');
const { sendPendingReviewInvites } = require('../utils/reviewCron');

const REVIEW_SECRET = process.env.REVIEW_SECRET || 'default-review-secret-change-me';
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
 * Utiliza la misma función del cron job para consistencia.
 */
async function sendReviewInvites(req, res) {
    try {
        // Llamar a la función del cron que hace todo el trabajo
        await sendPendingReviewInvites();
        
        res.json({ 
            ok: true, 
            message: "Proceso de envío de invitaciones completado. Revisa los logs del servidor para detalles." 
        });
    } catch (err) {
        console.error('[API] Error en sendReviewInvites:', err);
        res.status(500).json({ error: "Error generando invitaciones. Revisa los logs del servidor." });
    }
}

module.exports = {
    sendTest,
    sendReviewInvites,
};
