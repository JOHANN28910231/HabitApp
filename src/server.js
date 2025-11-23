<<<<<<< HEAD
// Merged server.js — provide graceful shutdown and export server
require('dotenv').config();
=======
>>>>>>> df98629 (fix: resolve merge residues; add foto_url to schema; clean seed)
const app = require('./app');
const http = require('http');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

<<<<<<< HEAD
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
=======
// Apagado ordenado (graceful shutdown)
function shutdown(signal) {
  console.log(`Recibido ${signal}, cerrando servidor...`);
>>>>>>> df98629 (fix: resolve merge residues; add foto_url to schema; clean seed)
  server.close(err => {
    if (err) {
      console.error('Error during server close:', err);
      process.exit(1);
    }
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
<<<<<<< HEAD

module.exports = server;
=======
>>>>>>> df98629 (fix: resolve merge residues; add foto_url to schema; clean seed)
