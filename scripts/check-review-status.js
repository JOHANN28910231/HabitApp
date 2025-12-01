require('dotenv').config();
const pool = require('../src/utils/db');

(async () => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.id_reservacion,
        r.id_huesped,
        r.id_habitacion,
        u.email,
        u.nombre_completo,
        (SELECT COUNT(*) FROM resenas 
         WHERE id_huesped = r.id_huesped 
         AND id_habitacion = r.id_habitacion) as tiene_resena
      FROM reservaciones r
      JOIN usuarios u ON u.id_usuario = r.id_huesped
      WHERE r.fecha_salida <= CURDATE()
      ORDER BY r.id_reservacion
    `);

    console.log('📊 Estado de reservaciones finalizadas:\n');
    rows.forEach(r => {
      const estado = r.tiene_resena > 0 ? '✅ CON reseña' : '❌ SIN reseña';
      console.log(`Reserva #${r.id_reservacion} - ${r.nombre_completo} (${r.email}): ${estado}`);
    });

    console.log(`\nTotal: ${rows.length} reservaciones finalizadas`);
    console.log(`Con reseña: ${rows.filter(r => r.tiene_resena > 0).length}`);
    console.log(`Sin reseña: ${rows.filter(r => r.tiene_resena === 0).length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
