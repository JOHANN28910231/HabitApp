require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASS = '',
  DB_NAME = 'habitapp'
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  multipleStatements: false
});

module.exports = pool;
