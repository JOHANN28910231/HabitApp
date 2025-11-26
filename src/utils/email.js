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

async function sendReviewInviteEmail(to, link) {
    return transporter.sendMail({
        to,
        from: process.env.MAIL_FROM || "no-reply@apptizihause.local",
        subject: "¡Tu estancia ha finalizado! Déjanos una reseña",
        html: `
            <p>Gracias por quedarte con nosotros.</p>
            <p>Puedes dejar tu reseña aquí:</p>
            <a href="${link}">${link}</a>
        `
    });
}

module.exports = {
    sendTestEmail,
    sendReviewInviteEmail,
};
