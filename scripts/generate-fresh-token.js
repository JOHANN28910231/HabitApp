require('dotenv').config();
const pool = require('../src/utils/db');
const jwt = require('jsonwebtoken');

const REVIEW_SECRET = process.env.REVIEW_SECRET || 'review-secret-key-change-in-production';

(async () => {
  try {
    // Buscar reservaciones finalizadas sin reseña
    const [rows] = await pool.query(`
      SELECT 
        r.id_reservacion,
        r.id_huesped,
        r.id_habitacion,
        u.nombre_completo,
        u.email,
        p.nombre_propiedad,
        h.descripcion as habitacion,
        r.fecha_salida
      FROM reservaciones r
      JOIN usuarios u ON u.id_usuario = r.id_huesped
      JOIN habitacion h ON h.id_habitacion = r.id_habitacion
      JOIN propiedades p ON p.id_propiedad = h.id_propiedad
      WHERE r.fecha_salida <= CURDATE()
        AND NOT EXISTS (
          SELECT 1 FROM resenas 
          WHERE id_reservacion = r.id_reservacion
        )
      ORDER BY r.id_reservacion DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      console.log('❌ No hay reservaciones finalizadas disponibles sin reseña.');
      console.log('\n💡 Opciones:');
      console.log('   1. Ejecuta: node scripts/insert-test-reservation.js');
      console.log('   2. O elimina una reseña existente de la tabla resenas');
      process.exit(0);
    }

    const reservacion = rows[0];
    
    console.log('\n✅ Reservación encontrada:');
    console.log(`   ID: ${reservacion.id_reservacion}`);
    console.log(`   Huésped: ${reservacion.nombre_completo} (${reservacion.email})`);
    console.log(`   Propiedad: ${reservacion.nombre_propiedad}`);
    console.log(`   Habitación: ${reservacion.habitacion}`);
    console.log(`   Checkout: ${reservacion.fecha_salida.toISOString().split('T')[0]}`);

    // Generar token
    const token = jwt.sign(
      {
        id_reservacion: reservacion.id_reservacion,
        id_huesped: reservacion.id_huesped,
        id_habitacion: reservacion.id_habitacion
      },
      REVIEW_SECRET,
      { expiresIn: '30d' }
    );

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    const reviewLink = `${publicBaseUrl}/reviews.html?token=${token}`;

    console.log('\n🔗 Link de reseña generado:');
    console.log(reviewLink);
    console.log('\n📋 Token:');
    console.log(token);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
