// Script para agregar columnas faltantes a la tabla propiedades
require('dotenv').config();
const mysql = require('mysql2/promise');

async function addColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'habitapp'
    });

    try {
        console.log('📡 Conectado a la base de datos');

        // Verificar si las columnas ya existen
        const [columns] = await connection.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'propiedades'",
            [process.env.DB_NAME || 'habitapp']
        );

        const columnNames = columns.map(c => c.COLUMN_NAME);
        console.log('📋 Columnas actuales:', columnNames);

        // Agregar url_fotos_p si no existe
        if (!columnNames.includes('url_fotos_p')) {
            console.log('➕ Agregando columna url_fotos_p...');
            await connection.query(
                "ALTER TABLE propiedades ADD COLUMN url_fotos_p VARCHAR(255) NULL AFTER estado_propiedad"
            );
            console.log('✅ Columna url_fotos_p agregada');
        } else {
            console.log('ℹ️  Columna url_fotos_p ya existe');
        }

        // Agregar servicios_generales si no existe
        if (!columnNames.includes('servicios_generales')) {
            console.log('➕ Agregando columna servicios_generales...');
            await connection.query(
                "ALTER TABLE propiedades ADD COLUMN servicios_generales TEXT NULL AFTER politicas_hospedaje"
            );
            console.log('✅ Columna servicios_generales agregada');
        } else {
            console.log('ℹ️  Columna servicios_generales ya existe');
        }

        // Mostrar estructura final
        const [finalColumns] = await connection.query("DESCRIBE propiedades");
        console.log('\n📊 Estructura final de la tabla propiedades:');
        console.table(finalColumns);

        console.log('\n✅ Proceso completado exitosamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

addColumns();
