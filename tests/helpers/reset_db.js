/*
  Helper para tests: importa el SQL de `db/init.sql` en la base de datos indicada por `.env.test`.
  Uso: const resetDb = require('./helpers/reset_db'); await resetDb();
*/
require('dotenv').config({ path: '.env.test' });
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');

async function resetDb() {
  const sqlPath = path.resolve(__dirname, '..', '..', 'db', 'init.sql');
  const sql = await fs.readFile(sqlPath, 'utf8');

  const {
    DB_HOST = '127.0.0.1',
    DB_PORT = 3306,
    DB_USER = 'root',
    DB_PASS = '',
    DB_NAME = 'habitapp_test'
  } = process.env;

  // Conectar sin seleccionar DB para crearla si es necesario
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  try {
    // Ejecuta todo el script (incluye CREATE DATABASE, USE, CREATE TABLE, INSERT ...)
    await conn.query(sql);
  } finally {
    await conn.end();
  }
}

module.exports = resetDb;