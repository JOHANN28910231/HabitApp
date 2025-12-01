// scripts/test-review-email.js
// Script para probar el envío de correos de invitación a reseñas

require('dotenv').config();
const { sendReviewInviteEmail } = require('../src/utils/email');
const jwt = require('jsonwebtoken');

const REVIEW_SECRET = process.env.REVIEW_SECRET || 'default-review-secret-change-me';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

async function testReviewEmail() {
    console.log('🧪 Probando sistema de correos de reseñas...\n');

    // Datos de prueba
    const testData = {
        to: 'test@ejemplo.com',
        id_reservacion: 1,
        id_huesped: 1,
        id_habitacion: 1,
        nombreHuesped: 'Juan Pérez',
        propiedad: 'Casa del Sol',
        habitacion: 'A-101'
    };

    console.log('📋 Datos de prueba:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('');

    // Generar token
    const token = jwt.sign(
        {
            id_reservacion: testData.id_reservacion,
            id_huesped: testData.id_huesped,
            id_habitacion: testData.id_habitacion,
        },
        REVIEW_SECRET,
        { expiresIn: '30d' }
    );

    const link = `${PUBLIC_BASE_URL}/reviews.html?token=${encodeURIComponent(token)}`;

    console.log('🔑 Token generado (válido por 30 días)');
    console.log('');
    console.log('🔗 Link de reseña:');
    console.log(link);
    console.log('');

    // Enviar correo
    console.log('📧 Enviando correo...');
    
    try {
        await sendReviewInviteEmail(
            testData.to,
            link,
            {
                nombreHuesped: testData.nombreHuesped,
                propiedad: testData.propiedad,
                habitacion: testData.habitacion
            }
        );

        console.log('\n✅ Correo enviado exitosamente!');
        
        if (!process.env.SMTP_HOST) {
            console.log('\n⚠️  MODO MOCK: Revisa el output arriba para ver el contenido del correo.');
            console.log('    Para envíos reales, configura SMTP_HOST en tu archivo .env');
        } else {
            console.log(`\n📬 Correo real enviado a: ${testData.to}`);
            console.log('    Revisa la bandeja de entrada del destinatario.');
        }

        console.log('\n🌐 Prueba el link en tu navegador:');
        console.log(link);

    } catch (error) {
        console.error('\n❌ Error al enviar correo:', error.message);
        console.error(error);
    }
}

// Ejecutar
testReviewEmail()
    .then(() => {
        console.log('\n✨ Test completado');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n💥 Error fatal:', err);
        process.exit(1);
    });
