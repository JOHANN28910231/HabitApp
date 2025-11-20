// src/utils/db.js
// Pool de conexión a MySQL usando mysql2/promise

const mysql = require('mysql2/promise');

/** @type {import('mysql2/promise').Pool} */
const pool = mysql.createPool({
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = pool;
