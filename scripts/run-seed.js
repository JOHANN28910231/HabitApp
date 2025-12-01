// scripts/run-seed.js
// Ejecuta el seed.sql para poblar la base de datos con datos de prueba

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/utils/db');

async function runSeed() {
    try {
        console.log('🌱 Ejecutando seed de base de datos...\n');

        // Leer el archivo seed.sql
        const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        // Dividir por statements (punto y coma)
        const statements = seedSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Ejecutando ${statements.length} statements SQL...\n`);

        let executed = 0;
        for (const statement of statements) {
            try {
                await pool.query(statement);
                executed++;
            } catch (err) {
                // Ignorar errores de "tabla ya existe" o "duplicados"
                if (!err.message.includes('already exists') && 
                    !err.message.includes('Duplicate')) {
                    console.warn(`⚠️  Warning: ${err.message.substring(0, 80)}...`);
                }
            }
        }

        console.log(`✅ Seed completado exitosamente (${executed} statements ejecutados)\n`);

        // Verificar que hay datos
        const [users] = await pool.query('SELECT COUNT(*) as count FROM usuarios');
        const [properties] = await pool.query('SELECT COUNT(*) as count FROM propiedades');
        const [rooms] = await pool.query('SELECT COUNT(*) as count FROM habitacion');

        console.log('📊 Datos insertados:');
        console.log(`   - Usuarios: ${users[0].count}`);
        console.log(`   - Propiedades: ${properties[0].count}`);
        console.log(`   - Habitaciones: ${rooms[0].count}`);

        await pool.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runSeed();
