// Script: agrega la columna foto_url a la tabla usuarios si no existe
require('dotenv').config();
const pool = require('../src/utils/db');

(async function () {
    try {
        const dbName = process.env.DB_NAME || 'habitapp';
        const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto_url'`, [dbName]);
        if (rows && rows[0] && rows[0].cnt > 0) {
            console.log('La columna foto_url ya existe en usuarios.');
            await pool.end();
            return process.exit(0);
        }
        console.log('Agregando columna foto_url a usuarios...');
        await pool.query(`ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(255) NULL`);
        console.log('Columna foto_url añadida.');
        await pool.end();
        process.exit(0);
    } catch (e) {
        console.error('Error al agregar columna foto_url:', e.message);
        try { await pool.end(); } catch (_) { }
        process.exit(1);
    }
})();
