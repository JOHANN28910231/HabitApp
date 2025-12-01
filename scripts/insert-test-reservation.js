// scripts/insert-test-reservation.js
// Inserta una reservación finalizada para probar el sistema de reseñas

require('dotenv').config();
const pool = require('../src/utils/db');

async function insertTestReservation() {
    try {
        console.log('🔧 Insertando reservación de prueba...\n');

        // Primero verificar que hay usuarios
        const [usuarios] = await pool.query('SELECT id_usuario, nombre_completo, email FROM usuarios LIMIT 1');
        if (usuarios.length === 0) {
            throw new Error('No hay usuarios en la base de datos. Ejecuta primero: node scripts/run-seed.js');
        }
        const usuario = usuarios[0];
        console.log(`✓ Usando usuario: ${usuario.nombre_completo} (${usuario.email})\n`);

        // Insertar reservación finalizada
        const [result] = await pool.query(`
            INSERT INTO reservaciones (id_habitacion, id_huesped, estado_reserva, fecha_reserva, fecha_inicio, fecha_salida, monto_total)
            SELECT 
                h.id_habitacion,
                ?,
                'finalizado',
                DATE_SUB(NOW(), INTERVAL 5 DAY),
                DATE_SUB(NOW(), INTERVAL 4 DAY),
                DATE_SUB(NOW(), INTERVAL 2 DAY),
                1600.00
            FROM habitacion h
            LIMIT 1
        `, [usuario.id_usuario]);

        const idReservacion = result.insertId;
        console.log(`✅ Reservación creada con ID: ${idReservacion}\n`);

        // Obtener detalles de la reservación
        const [rows] = await pool.query(`
            SELECT 
                r.id_reservacion,
                r.id_habitacion,
                r.id_huesped,
                u.nombre_completo,
                u.email,
                r.fecha_salida,
                r.estado_reserva,
                h.descripcion AS habitacion,
                p.nombre_propiedad AS propiedad
            FROM reservaciones r
            JOIN usuarios u ON u.id_usuario = r.id_huesped
            JOIN habitacion h ON h.id_habitacion = r.id_habitacion
            JOIN propiedades p ON p.id_propiedad = h.id_propiedad
            WHERE r.id_reservacion = ?
        `, [idReservacion]);

        if (rows.length > 0) {
            const reserva = rows[0];
            console.log('📋 Detalles de la reservación:');
            console.log('─'.repeat(50));
            console.log(`ID Reservación: ${reserva.id_reservacion}`);
            console.log(`Huésped: ${reserva.nombre_completo} (${reserva.email})`);
            console.log(`Propiedad: ${reserva.propiedad}`);
            console.log(`Habitación: ${reserva.habitacion_numero || 'N/A'}`);
            console.log(`Fecha de salida: ${reserva.fecha_salida}`);
            console.log(`Estado: ${reserva.estado_reserva}`);
            console.log('─'.repeat(50));
            console.log('\n✨ Esta reservación está lista para recibir invitación de reseña!');
        }

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

insertTestReservation();
