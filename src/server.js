require('dotenv').config();
const app = require('./app');
const http = require('http');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

// Apagado ordenado (graceful shutdown)
function shutdown(signal) {
  console.log(`Recibido ${signal}, cerrando servidor...`);
  server.close(err => {
    if (err) {
      console.error('Error al cerrar servidor:', err);
      process.exit(1);
    }
    console.log('Servidor cerrado.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
