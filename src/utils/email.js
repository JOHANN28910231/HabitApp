// src/utils/email.js
// Wrapper para enviar correos (mock por ahora)

const nodemailer = require('nodemailer');

// Si MAIL_PROVIDER está vacío => modo MOCK
const isMock = !process.env.SMTP_HOST;

function getTransport() {
    if (isMock) {
        return {
            sendMail: async (options) => {
                console.log("\n========================");
                console.log("📨 MOCK EMAIL ENVIADO:");
                console.log("A:", options.to);
                console.log("Asunto:", options.subject);
                console.log("HTML:", options.html);
                console.log("========================\n");
                return { mock: true };
            }
        };
    }

    // Si configuraron SMTP real
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });
}

const transporter = getTransport();

async function sendTestEmail(to, message = "Correo de prueba") {
    return transporter.sendMail({
        to,
        from: process.env.MAIL_FROM || "no-reply@apptizihause.local",
        subject: "Test Email",
        html: `<p>${message}</p>`
    });
}

async function sendReviewInviteEmail(to, link, context = {}) {
    const { nombreHuesped, propiedad, habitacion } = context;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Déjanos tu reseña</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">TiziHause</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Tu opinión es importante para nosotros</p>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    ${nombreHuesped ? `<p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Hola <strong>${nombreHuesped}</strong>,</p>` : ''}
                                    
                                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                                        Esperamos que hayas disfrutado tu estancia ${propiedad ? `en <strong>${propiedad}</strong>` : 'con nosotros'}${habitacion ? ` - Habitación ${habitacion}` : ''}.
                                    </p>
                                    
                                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 30px 0;">
                                        Nos encantaría conocer tu experiencia. Tu reseña ayuda a otros viajeros a tomar mejores decisiones y nos ayuda a mejorar nuestro servicio.
                                    </p>
                                    
                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 20px 0;">
                                                <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                                    Dejar mi reseña
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="font-size: 14px; color: #888; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                        <strong>Nota:</strong> Este enlace es único y personal. Solo podrás dejar una reseña por reservación. El enlace expira en 30 días.
                                    </p>
                                    
                                    <p style="font-size: 13px; color: #aaa; margin: 10px 0 0 0;">
                                        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                        <a href="${link}" style="color: #667eea; word-break: break-all;">${link}</a>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                                    <p style="margin: 0; font-size: 14px; color: #666;">
                                        Gracias por confiar en <strong>TiziHause</strong>
                                    </p>
                                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                                        © ${new Date().getFullYear()} TiziHause. Todos los derechos reservados.
                                    </p>
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Additional Footer Info -->
                        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                            <tr>
                                <td style="text-align: center; padding: 0 20px;">
                                    <p style="font-size: 12px; color: #999; margin: 0; line-height: 1.5;">
                                        Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return transporter.sendMail({
        to,
        from: process.env.MAIL_FROM || "no-reply@apptizihause.local",
        subject: "✨ ¡Cuéntanos sobre tu estancia en TiziHause!",
        html: htmlContent
    });
}

module.exports = {
    sendTestEmail,
    sendReviewInviteEmail,
};
