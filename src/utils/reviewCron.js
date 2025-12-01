// src/utils/reviewCron.js
// Cron job para enviar correos de invitación a reseñas automáticamente

const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { sendReviewInviteEmail } = require('./email');

const REVIEW_SECRET = process.env.REVIEW_SECRET || 'default-review-secret-change-me';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

// Archivo para trackear invitaciones enviadas
const INVITES_TRACKING_FILE = path.join(__dirname, '../../.review-invites-sent.json');

/**
 * Lee el registro de invitaciones ya enviadas
 */
function loadSentInvites() {
    try {
        if (fs.existsSync(INVITES_TRACKING_FILE)) {
            const data = fs.readFileSync(INVITES_TRACKING_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('[CRON] Error leyendo archivo de tracking:', err.message);
    }
    return {};
}

/**
 * Guarda el registro de una invitación enviada
 */
function markInviteAsSent(idReservacion, email) {
    try {
        const sentInvites = loadSentInvites();
        sentInvites[idReservacion] = {
            email,
            fecha_envio: new Date().toISOString()
        };
        fs.writeFileSync(INVITES_TRACKING_FILE, JSON.stringify(sentInvites, null, 2), 'utf8');
    } catch (err) {
        console.error('[CRON] Error guardando tracking:', err.message);
    }
}

/**
 * Verifica si ya se envió invitación para esta reservación
 */
function wasInviteSent(idReservacion) {
    const sentInvites = loadSentInvites();
    return !!sentInvites[idReservacion];
}

/**
 * Función que busca reservaciones finalizadas sin reseña
 * y envía invitación por correo con token único
 */
async function sendPendingReviewInvites() {
    try {
        console.log('[CRON] Iniciando envío de invitaciones de reseña...');
        
        // Buscar reservaciones que:
        // 1. La fecha de salida ya pasó (fecha_salida <= HOY)
        // 2. Estado es 'reservado' o 'finalizado'
        // 3. No existe una reseña del huésped para esa habitación
        const [rows] = await pool.query(`
            SELECT 
                r.id_reservacion,
                r.id_huesped,
                r.id_habitacion,
                r.fecha_salida,
                u.email,
                u.nombre_completo,
                h.descripcion AS habitacion_nombre,
                p.nombre_propiedad
            FROM reservaciones r
            JOIN usuarios u ON u.id_usuario = r.id_huesped
            JOIN habitacion h ON h.id_habitacion = r.id_habitacion
            JOIN propiedades p ON p.id_propiedad = h.id_propiedad
            WHERE r.fecha_salida <= CURDATE()
              AND NOT EXISTS (
                SELECT 1 FROM resenas rs
                WHERE rs.id_huesped = r.id_huesped
                  AND rs.id_habitacion = r.id_habitacion
              )
        `);

        if (rows.length === 0) {
            console.log('[CRON] No hay reservaciones pendientes de invitación.');
            return;
        }

        console.log(`[CRON] Encontradas ${rows.length} reservación(es) elegible(s).`);

        let enviados = 0;
        let yaEnviados = 0;

        for (const reserva of rows) {
            // Verificar si ya se envió invitación a esta reservación
            if (wasInviteSent(reserva.id_reservacion)) {
                yaEnviados++;
                console.log(`[CRON] Invitación ya enviada previamente: Reserva #${reserva.id_reservacion}`);
                continue;
            }

            try {
                // Crear token JWT con información de la reserva
                const token = jwt.sign(
                    {
                        id_reservacion: reserva.id_reservacion,
                        id_huesped: reserva.id_huesped,
                        id_habitacion: reserva.id_habitacion,
                    },
                    REVIEW_SECRET,
                    { expiresIn: '30d' } // Token válido por 30 días
                );

                // Construir link de reseña
                const link = `${PUBLIC_BASE_URL}/reviews.html?token=${encodeURIComponent(token)}`;

                // Enviar correo
                await sendReviewInviteEmail(
                    reserva.email,
                    link,
                    {
                        nombreHuesped: reserva.nombre_completo,
                        propiedad: reserva.nombre_propiedad,
                        habitacion: reserva.habitacion_nombre,
                    }
                );

                // Marcar como enviado
                markInviteAsSent(reserva.id_reservacion, reserva.email);
                
                enviados++;
                console.log(`[CRON] Invitación enviada a: ${reserva.email} (Reserva #${reserva.id_reservacion})`);

            } catch (err) {
                console.error(`[CRON] Error enviando invitación para reserva ${reserva.id_reservacion}:`, err.message);
            }
        }

        if (yaEnviados > 0) {
            console.log(`[CRON] ${yaEnviados} invitación(es) ya enviada(s) previamente (omitidas).`);
        }
        console.log(`[CRON] Proceso completado. ${enviados}/${rows.length} correos nuevos enviados exitosamente.`);

    } catch (err) {
        console.error('[CRON] Error en el proceso de invitaciones de reseña:', err);
    }
}

/**
 * Inicializar cron job
 * Se ejecuta todos los días a las 10:00 AM
 * Expresión cron: "0 10 * * *"
 * - 0: minuto 0
 * - 10: hora 10
 * - * * *: todos los días del mes, todos los meses, todos los días de la semana
 */
function initReviewCron() {
    // Ejecutar todos los días a las 10:00 AM hora del servidor
    cron.schedule('0 10 * * *', async () => {
        await sendPendingReviewInvites();
    }, {
        scheduled: true,
        timezone: "America/Mexico_City" // Ajusta según tu zona horaria
    });

    console.log('✓ Cron job de reseñas inicializado (se ejecutará diariamente a las 10:00 AM)');
}

module.exports = {
    initReviewCron,
    sendPendingReviewInvites, // Exportar para testing manual
};
